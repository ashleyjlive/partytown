import { callCustomElementCallback } from './worker-custom-elements';
import { callWorkerRefHandler } from './worker-serialization';
import { createEnvironment } from './worker-environment';
import { debug } from '../utils';
import { environments, webWorkerCtx } from './worker-constants';
import { ForwardMainTriggerData, MessageFromSandboxToWorker, WorkerMessageType } from '../types';
import { initNextScriptsInWebWorker } from './worker-exec';
import { initWebWorker } from './init-web-worker';
import { logWorker, normalizedWinId } from '../log';
import { workerForwardedTriggerHandle } from './worker-forwarded-trigger';
import { forwardLocationChange } from './worker-location';

const queuedEvents: MessageEvent<MessageFromSandboxToWorker>[] = [];

const receiveMessageFromSandboxToWorker = (ev: MessageEvent<MessageFromSandboxToWorker>) => {
  const msg = ev.data;
  const msgType = msg[0];
  const msgValue: any = msg[1];

  if (webWorkerCtx.$isInitialized$) {
    switch (msgType) {
      case WorkerMessageType.InitializeNextScript:
        initNextScriptsInWebWorker(msgValue);
        break;
      case WorkerMessageType.RefHandlerCallback:
        callWorkerRefHandler(msgValue);
        break;
      case WorkerMessageType.ForwardMainTrigger:
        workerForwardedTriggerHandle(msgValue as ForwardMainTriggerData);
        break;
      case WorkerMessageType.InitializeEnvironment:
        createEnvironment(msgValue);
        break;
      case WorkerMessageType.InitializedScripts:
        isInitialized(msgValue);
        break;
      case WorkerMessageType.DocumentVisibilityState:
        environments[msgValue].$visibilityState$ = msg[2];
        break;
      case WorkerMessageType.LocationUpdate:
        locationChanged(msgValue);
        break;
      case WorkerMessageType.CustomElementCallback:
        callCustomElementCallback(...msg);
        break;
      case WorkerMessageType.MainDataResponseToWorker:
        // received initial main data
        // initialize the web worker with the received the main data
        initWebWorker(msgValue);

        // request from main that the worker needs the interfaces
        webWorkerCtx.$postMessage$([WorkerMessageType.MainInterfacesRequestFromWorker]);
        break;
      case WorkerMessageType.MainInterfacesResponseToWorker:
        mainInterfaceResponse(msgValue)
        break;
      default:
        // the web worker hasn't finished initializing yet, let's store
        // this event so it can be re-ran after initialization
        queuedEvents.push(ev);
    }
  };

  function mainInterfaceResponse(msgValue: any) {
    // received more main thread interfaces, append them to the array
    webWorkerCtx.$interfaces$ = [...webWorkerCtx.$interfaces$, ...msgValue];
    webWorkerCtx.$isInitialized$ = 1;

    logWorker(`Initialized web worker`);

    // send to the main thread that the web worker has been initialized
    webWorkerCtx.$postMessage$([WorkerMessageType.InitializedWebWorker]);

    // replay any of the queued events we already have
    // before the web worker was initialized
    if (debug && queuedEvents.length) {
      logWorker(`Queued ready messages: ${queuedEvents.length}`);
    }
    [...queuedEvents].map(receiveMessageFromSandboxToWorker);
    queuedEvents.length = 0;
  }

  function isInitialized(msgValue: any) {
    if (debug && environments[msgValue].$isInitialized$ !== 1) {
      const winId = msgValue;
      const env = environments[winId];
      const winType = env.$winId$ === env.$parentWinId$ ? 'top' : 'iframe';
      logWorker(`Initialized ${winType} window ${normalizedWinId(winId)} environment 🎉`, winId);
    }

    environments[msgValue].$isInitialized$ = 1;
    environments[msgValue].$isLoading$ = 0;
  }

  function locationChanged(msgValue: any) {
    const $winId$ = msgValue.$winId$;
    const env = environments[$winId$];

    env.$location$.href = msgValue.url;

    forwardLocationChange(msgValue.$winId$, env, msgValue);
  }

  self.onmessage = receiveMessageFromSandboxToWorker;

  postMessage([WorkerMessageType.MainDataRequestFromWorker]);
}
