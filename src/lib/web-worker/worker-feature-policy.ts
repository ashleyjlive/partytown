import { CallType, type WorkerNode } from '../types';
import { callMethod, getter } from './worker-proxy';

export class FeaturePolicy {
  private readonly _instance: WorkerNode;

  constructor(instance: WorkerNode) {
    this._instance = instance;
  }

  public allowedFeatures() {
    return callMethod(
      this._instance,
      ['featurePolicy', 'allowedFeatures'],
      [],
      CallType.Blocking);
  }

  public allowsFeature(feature: string) {
    return callMethod(
      this._instance,
      ['featurePolicy', 'allowsFeature'],
      [feature],
      CallType.Blocking
    );
  }

  public features() {
    return callMethod(
      this._instance,
      ['featurePolicy', 'features'],
      [],
      CallType.Blocking);
  }

  public getAllowlistForFeature(feature: string) {
    return callMethod(
      this._instance,
      ['featurePolicy', 'getAllowlistForFeature'],
      [feature],
      CallType.Blocking
    );
  }
}
