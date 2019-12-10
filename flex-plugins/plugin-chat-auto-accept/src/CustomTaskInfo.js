import * as React from 'react';

class CustomTaskInfo extends React.Component {
  render() {
    return (
      <div>
        <h1 class="Twilio">Custom Info</h1>
        <h2 class="Twilio">Language</h2>
        <span>{this.props.task.attributes.language}</span>
      </div>
    );
  }
}

export default CustomTaskInfo;