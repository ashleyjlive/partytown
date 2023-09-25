import { CallType, type WorkerNode } from '../types';
import { callMethod, getter } from './worker-proxy';

export class FeaturePolicy {
  private readonly _instance: WorkerNode;

  constructor(instance: WorkerNode) {
    this._instance = instance;
  }

  public allowedFeatures() {
    return getter(this._instance, ['document', 'featurePolicy', 'allowedFeatures']);
  }

  public allowsFeature(feature: string) {
    return callMethod(
      this._instance,
      ['document', 'featurePolicy', 'allowsFeature'],
      [feature],
      CallType.Blocking
    );
  }

  public features() {
    return getter(this._instance, ['document', 'featurePolicy', 'features']);
  }

  public getAllowlistForFeature(feature: string) {
    return callMethod(
      this._instance,
      ['document', 'featurePolicy', 'getAllowlistForFeature'],
      [feature],
      CallType.Blocking
    );
  }
}
