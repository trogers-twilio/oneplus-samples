import * as React from 'react';
import { Actions, IconButton, withTheme } from '@twilio/flex-ui';

class CustomCompleteTaskButton extends React.Component {
  handleClick = () => {
    const { task } = this.props;
    Actions.invokeAction('CompleteTask', {
      reason: 'Completed manually from button',
      task
    });
  }

  render() {
    const { theme } = this.props;
    return (
      <IconButton
        icon="CloseLarge"
        onClick={this.handleClick}
        themeOverride={theme.TaskCanvasHeader.EndTaskButton}>
      </IconButton>
    )
  }
}

export default withTheme(CustomCompleteTaskButton);
