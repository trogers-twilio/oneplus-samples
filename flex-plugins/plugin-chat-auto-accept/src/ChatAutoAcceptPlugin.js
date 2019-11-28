import React from 'react';
import { Actions, TaskHelper, VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

const PLUGIN_NAME = 'ChatAutoAcceptPlugin';

export default class ChatAutoAcceptPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    console.debug('Flex UI version', VERSION);

    manager.workerClient.on('reservationCreated', (reservation) => {
      const { sid, task } = reservation;
      // This conditional check is optional. If you want all types of
      // tasks to be auto accepted, you can remove the 'if' statement
      if (TaskHelper.isChatBasedTask(task)) {
        Actions.invokeAction('AcceptTask', { sid });
        Actions.invokeAction('SelectTask', { sid });

        const mediaId = flex.AudioPlayerManager.play({
          url: 'https://notificationsounds.com/sound-effects/insight-578/download/mp3',
          repeatable: false
        });
      }
      if (TaskHelper.isCallTask(task)) {
        const mediaId = flex.AudioPlayerManager.play({
          url: 'https://notificationsounds.com/sound-effects/insight-578/download/mp3',
          repeatable: false
        });
      }
    });

    flex.Actions.addListener('afterAcceptTask', (payload) => {
      const { task } = payload;
      const { attributes: taskAttributes } = task;
      const { attributes: workerAttributes } = manager.workerClient;
      const { full_name: workerName } = workerAttributes;

      if (TaskHelper.isChatBasedTask(task)) {
        const { channelSid } = taskAttributes;
  
        const sendGreeting = () => {
          const greetingDelay = 3000;
          setTimeout(() => {
            const greeting = `Hello, my name is ${workerName}. How can I help you?`;
            flex.Actions.invokeAction('SendMessage', {
              body: greeting,
              channelSid
            });
          }, greetingDelay);
        }
        
        // Once the task is accepted, it takes time to join the agent to the channel.
        // Polling and checking for the channel is a way to ensure the channel
        // is ready to go before attempting to send our first message
        const checkChatReadyDelay = 250;
        const checkChatReadyInterval = setInterval(() => {
          const channel = manager.store.getState().flex.chat.channels[channelSid];
          if (channel && channel.source) {
            clearInterval(checkChatReadyInterval);
            sendGreeting();
          }
        }, checkChatReadyDelay);
      }
    })
  }
}
