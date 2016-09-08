import React from 'react';
import moment from 'moment';
import getInitials from './helpers/getInitials';

import Avatar from 'material-ui/Avatar';

import SeatIcon from '../images/seat.svg';

const SeatAvatar = React.createClass({
	getDefaultProps() {
		return {
			sold: false,
			user: undefined,
			size: undefined,
		};
	},
	getBackgroundColor() {
		let backgroundColor;
		if (this.props.sold) {
			backgroundColor = '#6CB132';
		} else if (this.props.user) {
			backgroundColor = '#5176C7';
		}
		return backgroundColor;
	},
	render() {
		return (
			<Avatar size={this.props.size} backgroundColor={this.getBackgroundColor()}>
			{this.props.user && !this.props.sold ?
				initialize(this.props.user.name) :
				<img src={SeatIcon} height="18" style={{opacity: .5}} />
			}
			</Avatar>
		);
	},
});
export default SeatAvatar;