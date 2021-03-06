import {
  CompanionFeedback,
  CompanionInputFieldColor,
  CompanionFeedbacks,
  CompanionFeedbackEvent,
  CompanionFeedbackResult
} from '../../../instance_skel_types'
import { X32State, X32Subscriptions } from './state'
import {
  GetTargetChoices,
  GetMuteGroupChoices,
  GetChannelSendChoices,
  convertChoices,
  GetBusSendChoices,
  GetOscillatorDestinations
} from './choices'
import { ensureLoaded } from './util'
import { MutePath, MainPath } from './paths'
import * as osc from 'osc'
import InstanceSkel = require('../../../instance_skel')
import { X32Config } from './config'

type CompanionFeedbackWithCallback = CompanionFeedback &
  Required<Pick<CompanionFeedback, 'callback' | 'subscribe' | 'unsubscribe'>>

export enum FeedbackId {
  Mute = 'mute',
  MuteGroup = 'mute_grp',
  MuteChannelSend = 'mute_channel_send',
  MuteBusSend = 'mute_bus_send',
  TalkbackTalk = 'talkback_talk',
  OscillatorEnable = 'oscillator-enable',
  OscillatorDestination = 'oscillator-destination'
}

export function ForegroundPicker(color: number): CompanionInputFieldColor {
  return {
    type: 'colorpicker',
    label: 'Foreground color',
    id: 'fg',
    default: color
  }
}
export function BackgroundPicker(color: number): CompanionInputFieldColor {
  return {
    type: 'colorpicker',
    label: 'Background color',
    id: 'bg',
    default: color
  }
}

function getOptColors(evt: CompanionFeedbackEvent): CompanionFeedbackResult {
  return {
    color: Number(evt.options.fg),
    bgcolor: Number(evt.options.bg)
  }
}

function getDataNumber(data: osc.MetaArgument[] | undefined, index: number): number | undefined {
  const val = data ? data[index] : undefined
  return val?.type === 'i' || val?.type === 'f' ? val.value : undefined
}

function subscribeFeedback(
  oscSocket: osc.UDPPort,
  state: X32State,
  subs: X32Subscriptions,
  path: string,
  id: string,
  type: string
): void {
  subs.subscribe(path, id, type as FeedbackId)
  ensureLoaded(oscSocket, state, path)
}
function unsubscribeFeedback(subs: X32Subscriptions, path: string, id: string): void {
  subs.unsubscribe(path, id)
}

export function GetFeedbacksList(
  self: InstanceSkel<X32Config>,
  oscSocket: osc.UDPPort,
  state: X32State,
  subs: X32Subscriptions
): CompanionFeedbacks {
  const mutableChannels = GetTargetChoices(state, { includeMain: true })
  const muteGroups = GetMuteGroupChoices(state)
  const channelSendSources = GetTargetChoices(state, {
    includeMain: false,
    skipDca: true,
    skipBus: true,
    skipMatrix: true
  })
  const channelSendTargets = GetChannelSendChoices(state, 'on')
  const busSendSources = GetTargetChoices(state, {
    skipInputs: true,
    includeMain: true,
    skipDca: true,
    skipBus: false,
    skipMatrix: true
  })

  const feedbacks: { [id in FeedbackId]: CompanionFeedbackWithCallback | undefined } = {
    [FeedbackId.Mute]: {
      label: 'Change colors from mute state',
      description: 'If the specified target is muted, change color of the bank',
      options: [
        BackgroundPicker(self.rgb(255, 0, 0)),
        ForegroundPicker(self.rgb(0, 0, 0)),
        {
          id: 'target',
          type: 'dropdown',
          label: 'Target',
          ...convertChoices(mutableChannels)
        },
        {
          id: 'state',
          type: 'checkbox',
          label: 'Muted',
          default: true
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        const data = state.get(MutePath(evt.options.target as string))
        const muted = getDataNumber(data, 0) === 0
        if (muted === !!evt.options.state) {
          return getOptColors(evt)
        }
        return {}
      },
      subscribe: (evt: CompanionFeedbackEvent): void => {
        const path = MutePath(evt.options.target as string)
        subscribeFeedback(oscSocket, state, subs, path, evt.id, evt.type)
      },
      unsubscribe: (evt: CompanionFeedbackEvent): void => {
        const path = MutePath(evt.options.target as string)
        unsubscribeFeedback(subs, path, evt.id)
      }
    },
    [FeedbackId.MuteGroup]: {
      label: 'Change colors from mute group state',
      description: 'If the specified mute group is muted, change color of the bank',
      options: [
        BackgroundPicker(self.rgb(255, 0, 0)),
        ForegroundPicker(self.rgb(0, 0, 0)),
        {
          id: 'mute_grp',
          type: 'dropdown',
          label: 'Target',
          ...convertChoices(muteGroups)
        },
        {
          id: 'state',
          type: 'checkbox',
          label: 'Muted',
          default: true
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        const data = state.get(evt.options.mute_grp as string)
        const muted = getDataNumber(data, 0) === 1
        if (muted === !!evt.options.state) {
          return getOptColors(evt)
        }
        return {}
      },
      subscribe: (evt: CompanionFeedbackEvent): void => {
        const path = evt.options.mute_grp as string
        subscribeFeedback(oscSocket, state, subs, path, evt.id, evt.type)
      },
      unsubscribe: (evt: CompanionFeedbackEvent): void => {
        const path = evt.options.mute_grp as string
        unsubscribeFeedback(subs, path, evt.id)
      }
    },
    [FeedbackId.MuteChannelSend]: {
      label: 'Change colors from channel to bus send mute state',
      description: 'If the specified channel send is muted, change color of the bank',
      options: [
        BackgroundPicker(self.rgb(255, 0, 0)),
        ForegroundPicker(self.rgb(0, 0, 0)),
        {
          type: 'dropdown',
          label: 'Source',
          id: 'source',
          ...convertChoices(channelSendSources)
        },
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(channelSendTargets)
        },
        {
          id: 'state',
          type: 'checkbox',
          label: 'Muted',
          default: true
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        const path = `${MainPath(evt.options.source as string)}/${evt.options.target}`
        const data = path ? state.get(path) : undefined
        const muted = getDataNumber(data, 0) === 0
        if (muted === !!evt.options.state) {
          return getOptColors(evt)
        }
        return {}
      },
      subscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `${MainPath(evt.options.source as string)}/${evt.options.target}`
        subscribeFeedback(oscSocket, state, subs, path, evt.id, evt.type)
      },
      unsubscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `${MainPath(evt.options.source as string)}/${evt.options.target}`
        unsubscribeFeedback(subs, path, evt.id)
      }
    },
    [FeedbackId.MuteBusSend]: {
      label: 'Change colors from bus to matrix send mute state',
      description: 'If the specified bus send is muted, change color of the bank',
      options: [
        BackgroundPicker(self.rgb(255, 0, 0)),
        ForegroundPicker(self.rgb(0, 0, 0)),
        {
          type: 'dropdown',
          label: 'Source',
          id: 'source',
          ...convertChoices(busSendSources)
        },
        {
          type: 'dropdown',
          label: 'Target',
          id: 'target',
          ...convertChoices(GetBusSendChoices(state))
        },
        {
          id: 'state',
          type: 'checkbox',
          label: 'Muted',
          default: true
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        const path = `${MainPath(evt.options.source as string)}/${evt.options.target}/on`
        const data = path ? state.get(path) : undefined
        const muted = getDataNumber(data, 0) === 0
        if (muted === !!evt.options.state) {
          return getOptColors(evt)
        }
        return {}
      },
      subscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `${MainPath(evt.options.source as string)}/${evt.options.target}/on`
        subscribeFeedback(oscSocket, state, subs, path, evt.id, evt.type)
      },
      unsubscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `${MainPath(evt.options.source as string)}/${evt.options.target}/on`
        unsubscribeFeedback(subs, path, evt.id)
      }
    },
    [FeedbackId.TalkbackTalk]: {
      label: 'Change colors from talkback talk state',
      description: 'If the specified talkback is on, change color of the bank',
      options: [
        BackgroundPicker(self.rgb(255, 0, 0)),
        ForegroundPicker(self.rgb(0, 0, 0)),
        {
          type: 'dropdown',
          label: 'Function',
          id: 'channel',
          ...convertChoices([
            {
              id: 'A',
              label: 'A'
            },
            {
              id: 'B',
              label: 'B'
            }
          ])
        },
        {
          id: 'state',
          type: 'checkbox',
          label: 'On',
          default: true
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        const path = `/-stat/talk/${evt.options.channel}`
        const data = path ? state.get(path) : undefined
        const isOn = getDataNumber(data, 0) !== 0
        if (isOn === !!evt.options.state) {
          return getOptColors(evt)
        }
        return {}
      },
      subscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `/-stat/talk/${evt.options.channel}`
        subscribeFeedback(oscSocket, state, subs, path, evt.id, evt.type)
      },
      unsubscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `/-stat/talk/${evt.options.channel}`
        unsubscribeFeedback(subs, path, evt.id)
      }
    },
    [FeedbackId.OscillatorEnable]: {
      label: 'Change colors from oscillator enabled state',
      description: 'If the oscillator is on, change color of the bank',
      options: [
        BackgroundPicker(self.rgb(255, 0, 0)),
        ForegroundPicker(self.rgb(0, 0, 0)),
        {
          id: 'state',
          type: 'checkbox',
          label: 'On',
          default: true
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        const path = `/-stat/osc/on`
        const data = path ? state.get(path) : undefined
        const isOn = getDataNumber(data, 0) !== 0
        if (isOn === !!evt.options.state) {
          return getOptColors(evt)
        }
        return {}
      },
      subscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `/-stat/osc/on`
        subscribeFeedback(oscSocket, state, subs, path, evt.id, evt.type)
      },
      unsubscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `/-stat/osc/on`
        unsubscribeFeedback(subs, path, evt.id)
      }
    },
    [FeedbackId.OscillatorDestination]: {
      label: 'Change colors from oscillator destination state',
      description: 'If the oscillator destination matches, change color of the bank',
      options: [
        BackgroundPicker(self.rgb(255, 0, 0)),
        ForegroundPicker(self.rgb(0, 0, 0)),
        {
          type: 'dropdown',
          label: 'destination',
          id: 'destination',
          ...convertChoices(GetOscillatorDestinations(state))
        }
      ],
      callback: (evt: CompanionFeedbackEvent): CompanionFeedbackResult => {
        const path = `/config/osc/dest`
        const data = path ? state.get(path) : undefined
        const destination = getDataNumber(data, 0)
        if (destination === Number(evt.options.destination)) {
          return getOptColors(evt)
        }
        return {}
      },
      subscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `/config/osc/dest`
        subscribeFeedback(oscSocket, state, subs, path, evt.id, evt.type)
      },
      unsubscribe: (evt: CompanionFeedbackEvent): void => {
        const path = `/config/osc/dest`
        unsubscribeFeedback(subs, path, evt.id)
      }
    }
  }

  return feedbacks
}
