import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingsService } from '../settings/settings.service';
import { Tree, TreeDocument } from '../trees/schemas/tree.schema';

type MissionConfig = {
  targetTrees: number;
  label: string;
  targetYear: number;
  percentOverride?: number | null;
};

const DEFAULT_CONFIG: MissionConfig = {
  targetTrees: 1_000_000,
  label: String(new Date().getFullYear()),
  targetYear: 2047,
  percentOverride: null,
};

@Injectable()
export class MissionProgressService {
  private readonly logger = new Logger(MissionProgressService.name);

  constructor(
    @InjectModel(Tree.name) private readonly treeModel: Model<TreeDocument>,
    private readonly settingsService: SettingsService,
  ) {}

  private async loadConfig(): Promise<MissionConfig> {
    try {
      const setting = await this.settingsService.findBySettingName('MISSION_2047');
      const raw = String(setting.value || '').trim();
      if (!raw) return { ...DEFAULT_CONFIG };
      try {
        const parsed = JSON.parse(raw) as Partial<MissionConfig>;
        return {
          targetTrees:
            typeof parsed.targetTrees === 'number' && parsed.targetTrees > 0
              ? parsed.targetTrees
              : DEFAULT_CONFIG.targetTrees,
          label: parsed.label || DEFAULT_CONFIG.label,
          targetYear: parsed.targetYear || DEFAULT_CONFIG.targetYear,
          percentOverride:
            typeof parsed.percentOverride === 'number'
              ? parsed.percentOverride
              : null,
        };
      } catch {
        // Plain numeric value = targetTrees
        const asNumber = Number(raw);
        if (Number.isFinite(asNumber) && asNumber > 0) {
          return { ...DEFAULT_CONFIG, targetTrees: asNumber };
        }
        return { ...DEFAULT_CONFIG };
      }
    } catch {
      this.logger.debug(
        'MISSION_2047 setting not found — using default target 1,000,000',
      );
      return { ...DEFAULT_CONFIG };
    }
  }

  async getProgress() {
    const config = await this.loadConfig();
    const totalTrees = await this.treeModel.countDocuments().exec();

    const computed = Math.min(
      100,
      Math.round((totalTrees / config.targetTrees) * 100),
    );
    const percent =
      typeof config.percentOverride === 'number'
        ? Math.min(100, Math.max(0, Math.round(config.percentOverride)))
        : computed;

    return {
      percent,
      label: config.label,
      targetYear: config.targetYear,
      targetTrees: config.targetTrees,
      totalTrees,
      updatedAt: new Date().toISOString(),
    };
  }
}
