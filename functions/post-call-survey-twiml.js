const createActionUrl = (context, event, nextStep, surveyTaskSid) => {
  const {
    Language,
    TaskSid
  } = event;
  const {
    DOMAIN_NAME
  } = context;
  return `https://${DOMAIN_NAME}/post-call-survey-twiml`
    + `?Language=${Language}`
    + `&TaskSid=${TaskSid}`
    + `&Step=${nextStep}`
    + `&SurveyTaskSid=${surveyTaskSid}`
}

const createSurveyTask = async (context, event) => {
  const client = context.getTwilioClient();
  const {
    TaskSid
  } = event;
  const {
    TWILIO_SURVEY_WORKFLOW_SID,
    TWILIO_WORKSPACE_SID
  } = context;

  const taskAttributes = {
    conversations: {
      conversation_id: TaskSid,
      abandoned: 'No',
      queue_time: 0
    }
  };

  let task;
  try {
    task = await client.taskrouter
      .workspaces(TWILIO_WORKSPACE_SID)
      .tasks
      .create({
          attributes: JSON.stringify(taskAttributes),
          taskChannel: 'voice',
          timeout: 3600,
          workflowSid: TWILIO_SURVEY_WORKFLOW_SID
        });
    console.log('Created task', task.sid);
  } catch (error) {
    console.error('Error creating task.', error);
  }
  return task && task.sid;
}

const updateSurveyTask = async (context, surveyTaskSid, step, digits) => {
  const client = context.getTwilioClient();
  const {
    TWILIO_WORKSPACE_SID
  } = context;

  let surveyTask;
  try {
    console.log('Fetching survey task SID', surveyTaskSid);
    surveyTask = await client.taskrouter
      .workspaces(TWILIO_WORKSPACE_SID)
      .tasks(surveyTaskSid)
      .fetch();
  } catch (error) {
    console.error('Error fetching survey task.', error);
    return;
  }
  const { attributes: attributesJSON } = surveyTask;
  const attributes = attributesJSON && JSON.parse(attributesJSON);
  console.log('Survey task attributes:', attributes);
  const newAttributes = {
    ...attributes
  };

  let surveyScore = digits ? parseInt(digits) : 0;
  surveyScore = isNaN(surveyScore) ? 0 : surveyScore;
  switch (step) {
    case 'question1': {
      newAttributes.conversations.conversation_measure_1 = surveyScore;
      break;
    }
    case 'question2': {
      newAttributes.conversations.conversation_measure_2 = surveyScore;
      break;
    }
    default:
      // Nothing to do here
  }
  
  try {
    console.log('Updating survey task with attributes', newAttributes);
    await client.taskrouter
      .workspaces(TWILIO_WORKSPACE_SID)
      .tasks(surveyTaskSid)
      .update({
        attributes: JSON.stringify(newAttributes)
      })
  } catch (error) {
    console.error('Error updating survey task.', error);
  }
}

const cancelSurveyTask = async (context, surveyTaskSid) => {
  const client = context.getTwilioClient();
  const {
    TWILIO_WORKSPACE_SID
  } = context;

  try {
    console.log('Canceling survey task SID', surveyTaskSid);
    await client.taskrouter
      .workspaces(TWILIO_WORKSPACE_SID)
      .tasks(surveyTaskSid)
      .update({
        assignmentStatus: 'canceled',
        reason: 'Survey completed'
      })
  } catch (error) {
    console.error('Error canceling survey task.', error);
  }
}

exports.handler = async function(context, event, callback) {
	let twiml = new Twilio.twiml.VoiceResponse();
  const {
    Digits,
    Language,
    Step,
    SurveyTaskSid
  } = event;

  const voiceOptions = {
    voice: 'alice',
    language: Language
  }
  const gatherOptions = {
    actionOnEmptyResult: true,
    numDigits: 1,
    timeout: 10,
  }
  
  const surveyGreeting = {
    'en-US': 'Please remain on the line for a brief two question survey.',
    'zh-CN': '請保持在線進行簡短的兩個問題的調查.'
  };
  const surveyQuestion1 = {
    'en-US': 'On a scale of 1 to 5, with 5 being very satisfied, how satisfied were you with the service you received on your call today.',
    'zh-CN': '以1到5的等級, 對5表示非常滿意, 您對今天在電話中收到的服務有多滿意.'
  };
  const surveyQuestion2 = {
    'en-US': 'On a scale of 1 to 5, with 5 being very helpful, how helpful was the representative you last spoke with today.',
    'zh-CN': '在1到5的等級中, 有5個非常有幫助, 您今天與之交談的代表的幫助程度如何.'
  };
  const surveyClosing = {
    'en-US': 'Thank you for your time and feedback. Have a great day!',
    'zh-CN': '感謝您的時間和反饋. 祝你有美好的一天!'
  }

  switch (Step) {
    case 'greeting': {
      const surveyTaskSid = await createSurveyTask(context, event);
      const action = createActionUrl(context, event, 'question1', surveyTaskSid);
      twiml.say(voiceOptions, surveyGreeting[Language])
      const gather = twiml.gather({
        ...gatherOptions,
        action
      });
      gather.say(voiceOptions, surveyQuestion1[Language]);
      break;
    }
    case 'question1': {
      await updateSurveyTask(context, SurveyTaskSid, Step, Digits);
      const action = createActionUrl(context, event, 'question2', SurveyTaskSid);
      const gather = twiml.gather({
        ...gatherOptions,
        action
      });
      gather.say(voiceOptions, surveyQuestion2[Language]);
      break;
    }
    case 'question2': {
      await updateSurveyTask(context, SurveyTaskSid, Step, Digits);
      await cancelSurveyTask(context, SurveyTaskSid);
      twiml.say(voiceOptions, surveyClosing[Language]);
      twiml.hangup();
      break;
    }
    default:
      twiml.hangup();
  }

  console.log('Returning TwiML:', twiml.toString())
	callback(null, twiml);
};