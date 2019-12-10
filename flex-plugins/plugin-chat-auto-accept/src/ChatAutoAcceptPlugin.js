import React from 'react';
import { Actions, TaskHelper, VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import CustomEndChatButton from './CustomEndChatButton';
import CustomCompleteTaskButton from './CustomCompleteTaskButton';
import CustomTaskInfo from './CustomTaskInfo';

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
    });

    const isChatTask = (props) => {
      return TaskHelper.isLiveChat(props.task);
    };

    const isInWrapupMode = (props) => {
      return TaskHelper.isInWrapupMode(props.task);
    }

    // This block of code removes the TaskCanvas Header and adds a button to end
    // the chat and complete the task to the task list item since these buttons
    // are no longer visible once the TaskCanvas Header is removed
    flex.TaskCanvas.Content.remove('header');
    flex.TaskListButtons.Content.add(<CustomEndChatButton key="custom-end-chat-button" />, { if: isChatTask });
    flex.TaskListButtons.Content.add(<CustomCompleteTaskButton key="custom-complete-task-button" />, { if: isInWrapupMode });

    // This block of code is for enabling post call survey. We're tapping into
    // the HangupCall action to prevent the call from disconnecting when the agent
    // clicks Hangup Call. Instead, we're calling a custom Twilio Function to
    // <Redirect> the call to the Survey Studio Flow webhook.
    const redirectCallToSurvey = (task) => {
      const { attributes, taskSid } = task;
      const { call_sid, language } = attributes;
      const fetchUrl = `https://${manager.configuration.serviceBaseUrl}/redirect-call-to-survey`;
      const flexUserToken = manager.store.getState().flex.session.ssoTokenPayload.token;

      return fetch(fetchUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: (
          `token=${flexUserToken}`
          + `&callSid=${call_sid}`
          + `&language=${language}`
          + `&taskSid=${taskSid}`
        )
      }).then(response => response.json());
    }

    flex.Actions.addListener('beforeHangupCall', async (payload, abortOriginal) => {
      const { task } = payload;

      const redirectResult = await redirectCallToSurvey(task);
      if (redirectResult.status !== 200) {
        console.error('Failed to redirect call to survey.', redirectResult);
        return;
      }
      console.log('Call redirected to survey');
      abortOriginal();
    });

    // To add custom information to the Task Info Panel
    flex.TaskInfoPanel.Content.add(<CustomTaskInfo key="custom-task-info" />, { sortOrder: -1 });
  }
}
