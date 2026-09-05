/**
 * MockAIService
 *
 * Activated when OPENAI_MOCK_MODE=true in .env
 * Replaces the OpenAI API call with a scripted intent-matching engine.
 * ALL real backend services remain active (JWT, MongoDB, TreesService,
 * PendingActionsService, FieldIssuesService, etc.).
 *
 * Switch to real OpenAI at any time:
 *   OPENAI_MOCK_MODE=false
 *   OPENAI_API_KEY=<key>
 *   OPENAI_MODEL=gpt-4o-mini
 */

export type MockAIDecision =
  | { type: 'message'; content: string }
  | {
      type: 'tool_call';
      toolName: string;
      args: Record<string, any>;
      followUpMessage: string;
    };

// ── Per-user in-progress registration / complaint state ────────────────────────
// In production mock testing this is ephemeral (process memory).
// It resets on server restart, which is fine for testing.
const TREE_REG_STATE: Record<
  string,
  Partial<{ treeName: string; city: string; plantedDate: string }>
> = {};

const COMPLAINT_STATE: Record<
  string,
  Partial<{ type: string; description: string; treeCode?: string; step: 'type' | 'desc' | 'tree' }>
> = {};

// ── Helpers ────────────────────────────────────────────────────────────────────
const TREE_NAMES = [
  'neem', 'peepal', 'mango', 'banyan', 'gulmohar', 'teak', 'oak',
  'pine', 'bamboo', 'ashoka', 'amla', 'arjun', 'kadamba', 'sheesham',
];

const CITIES = [
  'indore', 'bhopal', 'delhi', 'mumbai', 'pune', 'jaipur', 'surat',
  'lucknow', 'nagpur', 'jabalpur', 'raipur', 'ujjain', 'gwalior', 'kota',
];

const COMPLAINT_TYPES: Record<string, string> = {
  'dead tree': 'Dead Tree',
  'water shortage': 'Water Shortage',
  'water': 'Water Shortage',
  'missing': 'Missing',
  'damaged': 'Damaged Guard',
  'disease': 'Disease/Pest',
  'pest': 'Disease/Pest',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Main decision function ─────────────────────────────────────────────────────
export function mockAIDecide(
  userMessage: string,
  userId: string,
): MockAIDecision {
  const msg = userMessage.toLowerCase().trim();

  // ─ Priority: continue an in-progress complaint dialog ─────────────────────
  const complaintState = COMPLAINT_STATE[userId];
  if (complaintState) {
    if (complaintState.step === 'type') {
      // User is answering: what type of complaint?
      const matched = Object.keys(COMPLAINT_TYPES).find((k) => msg.includes(k));
      const type = matched ? COMPLAINT_TYPES[matched] : 'Other';
      COMPLAINT_STATE[userId] = { ...complaintState, type, step: 'desc' };
      return {
        type: 'message',
        content: `✅ Complaint type: **${type}**\n\nAb batao: **Kya problem hai? Describe karein** (e.g., "Tree sukh gaya hai 2 mahine se")`,
      };
    }

    if (complaintState.step === 'desc') {
      COMPLAINT_STATE[userId] = { ...complaintState, description: userMessage, step: 'tree' };
      return {
        type: 'message',
        content:
          `✅ Description note ki gayi.\n\n` +
          `Kya yeh complaint kisi specific tree ke baare mein hai?\n` +
          `Agar haan to **tree ID** batao (e.g., TR-001), warna **"no"** likhein.`,
      };
    }

    if (complaintState.step === 'tree') {
      const treeCode = /^(no|nahi|skip|none)$/.test(msg) ? undefined : userMessage.trim();
      const { type, description } = complaintState;
      delete COMPLAINT_STATE[userId];
      return {
        type: 'tool_call',
        toolName: 'request_create_complaint',
        args: { type, description, treeCode },
        followUpMessage:
          `🚨 **Complaint Details:**\n\n` +
          `• Type: **${type}**\n` +
          `• Description: "${description}"\n` +
          (treeCode ? `• Tree Code: **${treeCode}**\n` : '') +
          `\nComplaint staged! Neeche **Confirm** button tap karo to register it. ✅`,
      };
    }
  }

  // ─ Priority: continue an in-progress tree registration dialog ─────────────
  const regState = TREE_REG_STATE[userId];
  if (regState !== undefined) {
    // Waiting for treeName
    if (!regState.treeName) {
      const matched = TREE_NAMES.find((t) => msg.includes(t));
      if (matched) {
        TREE_REG_STATE[userId] = { ...regState, treeName: capitalize(matched) };
        return {
          type: 'message',
          content: `✅ **${capitalize(matched)}** tree — bilkul!\n\nAb batao: **Kaun si city mein lagaya?** (e.g., Indore, Bhopal, Delhi)`,
        };
      }
      // Any free text as tree name
      const freeName = userMessage.trim();
      if (freeName.length >= 2 && freeName.length <= 50) {
        TREE_REG_STATE[userId] = { ...regState, treeName: capitalize(freeName) };
        return {
          type: 'message',
          content: `✅ **${capitalize(freeName)}** tree — note kiya!\n\nAb batao: **Kaun si city mein lagaya?** (e.g., Indore, Bhopal, Delhi)`,
        };
      }
      return { type: 'message', content: 'Kripya tree ka naam batayein (e.g., Neem, Peepal, Mango).' };
    }

    // Waiting for city
    if (!regState.city) {
      const matched = CITIES.find((c) => msg.includes(c));
      if (matched) {
        TREE_REG_STATE[userId] = { ...regState, city: capitalize(matched) };
        return {
          type: 'message',
          content: `✅ City: **${capitalize(matched)}**\n\nAb batao: **Kab lagaya tha?** (YYYY-MM-DD format mein, e.g., 2024-06-15)`,
        };
      }
      // Any short free-text city name
      const freeCity = userMessage.trim();
      if (freeCity.length >= 2 && freeCity.length <= 50) {
        TREE_REG_STATE[userId] = { ...regState, city: capitalize(freeCity) };
        return {
          type: 'message',
          content: `✅ City: **${capitalize(freeCity)}**\n\nAb batao: **Kab lagaya tha?** (YYYY-MM-DD format, e.g., 2024-06-15)`,
        };
      }
      return { type: 'message', content: 'Kripya city ka naam batayein (e.g., Indore, Delhi).' };
    }

    // Waiting for date
    if (!regState.plantedDate) {
      const dateMatch = msg.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (dateMatch) {
        const plantedDate = dateMatch[1];
        const { treeName, city } = regState;
        delete TREE_REG_STATE[userId];
        return {
          type: 'tool_call',
          toolName: 'request_tree_registration',
          args: { treeName, city, plantedDate },
          followUpMessage:
            `🌳 **Tree Registration Details:**\n\n` +
            `• Tree: **${treeName}**\n` +
            `• City: **${city}**\n` +
            `• Date Planted: **${plantedDate}**\n\n` +
            `Registration request staged! Neeche **Confirm** button tap karo to proceed. ✅`,
        };
      }
      return {
        type: 'message',
        content: 'Kripya date YYYY-MM-DD format mein batayein (e.g., 2024-06-15).',
      };
    }
  }

  // ─ Greetings ────────────────────────────────────────────────────────────────
  if (/^(hello|hi|hey|namaste|helo|namaskar|hy|hii|yo)\b/.test(msg)) {
    return {
      type: 'message',
      content:
        'Namaste! 🙏 Main Paryavaran Prahri ka AI assistant hoon.\n\n' +
        'Main aapki madad kar sakta hoon:\n\n' +
        '🌳 **Apne trees dekhne ke liye** → "Show my trees"\n' +
        '🔍 **Kisi ek tree ki detail** → "Tell me about my Neem tree"\n' +
        '📋 **Certificate check karne ke liye** → "Is my certificate ready?"\n' +
        '➕ **Tree register karne ke liye** → "I want to register a tree"\n' +
        '🚨 **Complaint karne ke liye** → "I want to report a problem"\n' +
        '❓ **Project ke baare mein** → "What is Paryavaran Prahri?"\n\n' +
        'Kya help chahiye?',
    };
  }

  // ─ Tree count / list ─────────────────────────────────────────────────────────
  if (
    /how many tree|kitne tree|mera tree count|my tree count|show.*tree|list.*tree|meri tree|apne tree/
      .test(msg)
  ) {
    return {
      type: 'tool_call',
      toolName: 'get_my_trees',
      args: {},
      followUpMessage: 'Aapke registered trees fetch kar raha hoon... 🌳',
    };
  }

  // ─ Tree details (specific tree) ──────────────────────────────────────────────
  if (/tell me about|details.*tree|tree.*detail|info.*tree|tree.*info|tell.*tree/.test(msg)) {
    const matched = TREE_NAMES.find((t) => msg.includes(t));
    if (matched) {
      return {
        type: 'tool_call',
        toolName: 'get_my_trees',
        args: { filterName: capitalize(matched) },
        followUpMessage: `**${capitalize(matched)}** tree ki details fetch kar raha hoon...`,
      };
    }
    return {
      type: 'tool_call',
      toolName: 'get_my_trees',
      args: {},
      followUpMessage: 'Aapke trees ki details fetch kar raha hoon...',
    };
  }

  // ─ Certificate ───────────────────────────────────────────────────────────────
  if (/certificate|certif|praman patra/.test(msg)) {
    return {
      type: 'tool_call',
      toolName: 'get_my_certificate',
      args: {},
      followUpMessage: 'Aapka certificate status check kar raha hoon... 📋',
    };
  }

  // ─ Activities ────────────────────────────────────────────────────────────────
  if (/activit|activity|meri activity|my activity|stats/.test(msg)) {
    return {
      type: 'tool_call',
      toolName: 'get_my_activities',
      args: {},
      followUpMessage: 'Aapki activity stats fetch kar raha hoon... 📊',
    };
  }

  // ─ Tree registration (start dialog) ──────────────────────────────────────────
  if (
    /register.*tree|tree.*register|plant.*tree|add.*tree|naya tree|ped lagana|lagwana/.test(msg)
  ) {
    TREE_REG_STATE[userId] = {};
    return {
      type: 'message',
      content:
        '🌱 Zaroor! Main aapka tree register karunga.\n\nPehle mujhe kuch details chahiye:\n\n**Kaun sa tree hai?** (e.g., Neem, Peepal, Mango, Banyan)',
    };
  }

  // ─ Complaint (start dialog) ──────────────────────────────────────────────────
  if (
    /complaint|shikayat|report.*problem|problem.*report|issue.*tree|tree.*issue|report a|koi problem/.test(msg)
  ) {
    COMPLAINT_STATE[userId] = { step: 'type' };
    return {
      type: 'message',
      content:
        '🚨 Theek hai, main aapki complaint register karunga.\n\n' +
        '**Complaint ka type kya hai?**\n\n' +
        '• Dead Tree\n' +
        '• Water Shortage\n' +
        '• Missing\n' +
        '• Damaged Guard\n' +
        '• Disease/Pest\n' +
        '• Other\n\n' +
        'Type karein (e.g., "Dead Tree"):',
    };
  }

  // ─ Knowledge base ────────────────────────────────────────────────────────────
  if (
    /what is|kya hai|how to|kaise|paryavaran|donate|initiative|vision|mission|goal|about|ke baare/.test(
      msg,
    )
  ) {
    return {
      type: 'tool_call',
      toolName: 'search_knowledge_base',
      args: { query: userMessage },
      followUpMessage: 'Knowledge base search kar raha hoon...',
    };
  }

  // ─ Default ───────────────────────────────────────────────────────────────────
  return {
    type: 'message',
    content:
      'Mujhe samjha nahi. Aap in mein se kuch try kar sakte hain:\n\n' +
      '• "Show my trees"\n' +
      '• "Is my certificate ready?"\n' +
      '• "I want to register a tree"\n' +
      '• "I want to report a problem"\n' +
      '• "What is Paryavaran Prahri?"',
  };
}
