import * as React from 'react';
import { Actions, IconButton, withTheme } from '@twilio/flex-ui';

class CustomEndChatButton extends React.Component {
  handleClick = () => {
    const { task } = this.props;
    Actions.invokeAction('WrapupTask', {
      reason: 'Completed manually from button',
      task
    });
  }

  render() {
    const { theme } = this.props;
    return (
      <IconButton
        icon="Hangup"
        onClick={this.handleClick}
        themeOverride={theme.TaskList.Item.Buttons.RejectButton}>
      </IconButton>
    )
  }
}

export default withTheme(CustomEndChatButton);
