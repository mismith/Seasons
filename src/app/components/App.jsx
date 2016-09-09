import React from 'react';
import {Link, browserHistory} from 'react-router';

import moment from 'moment';
import fire from '../utils/firebase';

import Drawer from 'material-ui/Drawer';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';

import AppBar from 'material-ui/AppBar';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';

import AddIcon from 'material-ui/svg-icons/content/add';
import PowerSettingsIcon from 'material-ui/svg-icons/action/power-settings-new';

import GameItem from './GameItem';


export default React.createClass({
	getDefaultProps() {
		return {
			params: {
				seasonId: 0,
				gameId: 0,
			},
		};
	},
	getInitialState() {
		return {
			drawerOpen: false,
			season:  {seats: [], users: []},
			game:    {seats: []},
			games:   {},
			seasons: {},
		};
	},


	unbindPageData() {
		if (this.seasonRef) fire.rebase.removeBinding(this.seasonRef);
		if (this.gameRef) fire.rebase.removeBinding(this.gameRef);
	},
	bindPageData(props = this.props) {
		this.unbindPageData();

		this.seasonRef = fire.rebase.bindToState('seasons/' + props.params.seasonId, {
			context: this,
			state: 'season',
		});
		this.gameRef = fire.rebase.bindToState('seasons:games/' + props.params.seasonId + '/' + props.params.gameId, {
			context: this,
			state: 'game',
		});
	},
	componentWillMount() {
		this.seasonsRef = fire.rebase.bindToState('seasons', {
			context: this,
			state: 'seasons',
		});
		this.gamesRef = fire.rebase.bindToState('seasons:games', {
			context: this,
			state: 'games',
		});

		this.bindPageData();
	},
	componentWillReceiveProps(nextProps) {
		this.bindPageData(nextProps);
	},
	componentWillUnmount() {
		fire.rebase.removeBinding(this.seasonsRef);
		fire.rebase.removeBinding(this.gamesRef);

		this.unbindPageData();
	},

	collectRelevantGames() {
		let relevantGames = [],
			seasons = fire.toArray(this.state.seasons);
		fire.toArray(this.state.games).map(games => {
			fire.toArray(games).filter(game => {
				let dayDiff = moment(game.datetime).diff('2016-10-21', 'days');
				if (dayDiff < 0) {
					// game has passed
					if(!game.seats && !game.sold) {
						// we don't know if sold or attended yet
						return true;
					} else if (dayDiff > -3) {
						// game was in the past 3 days
						return true;
					}
				} else {
					// game is upcoming
					if (dayDiff < 3) {
						// game is in the next 3 days
						return true;
					}
				}
			}).map(game => {
				game.$season = seasons[games.$id];
				relevantGames.push(game);
			});
		});
		return relevantGames;
	},
	getTitle() {
		if (this.state.game.opponent) {
			return this.state.game.opponent;
		} else if (this.state.season.name) {
			return this.state.season.name;
		} else {
			return 'Seasons';
		}
	},
	getParentUrl() {
		let path = '';
		if (this.props.routes) {
			const routes = this.props.routes.filter(route => route.path && route.path.length > 1); // trim root and any RouteIndex/empty-path-routes
			if (routes.length > 1) { // can only have a parent if it's not the only route
				for (let i = 0; i < routes.length - 1; i++) { // all but the last one
					path += '/' + routes[i].path;
				}
				path = path.replace(/:\w+/ig, key => this.props.params[key.substring(1)]); // replace params with current values
			}
		}
		return path;
	},

	handleDrawerToggle() {
		this.setState({drawerOpen: !this.state.drawerOpen});
	},
	handleDrawerClose() {
		this.setState({drawerOpen: false});
	},
	handleChange(name, field, value) {
		this.setState({
			[name]: Object.assign(this.state[name], {
				[field]: value,
			}),
		});
	},

	render() {
		let relevantGames = this.collectRelevantGames();
		return (
			<div>
				<Drawer
					docked={false}
					open={this.state.drawerOpen}
					containerStyle={{display: 'flex', flexDirection: 'column'}}
				>
					<List onTouchTap={this.handleDrawerClose}>
						<Subheader>Seasons</Subheader>
					{fire.toArray(this.state.seasons).map(season => 
						<ListItem
						 	key={season.$id}
							primaryText={season.name}
							containerElement={<Link to={'/season/' + season.$id} />}
						/>
					)}
						{/*<ListItem
							primaryText="Add new season"
							rightIcon={<AddIcon />}
							containerElement={<Link to="/season/new" />}
						/>*/}
						<Divider />
					</List>

				{relevantGames.length > 0 && 
					<List onTouchTap={this.handleDrawerClose}>
						<Subheader>Games</Subheader>
					{relevantGames.map((game, gameIndex) => 
						<GameItem
							key={gameIndex}
							game={game}
							season={game.$season}
							showDayAvatar={false}
							containerElement={<Link to={'/season/' + game.$season.$id + '/game/' + game.$id} />}
						/>
					)}
						<Divider />
					</List>
				}

					<List onTouchTap={this.handleDrawerClose} style={{marginTop: 'auto'}}>
						<Subheader>Account</Subheader>
						<ListItem
							primaryText="Logout"
							rightIcon={<PowerSettingsIcon />}
						/>
					</List>
				</Drawer>
				<AppBar
					title={this.getTitle()}
					onTitleTouchTap={e=>browserHistory.push(this.getParentUrl())}
					onLeftIconButtonTouchTap={this.handleDrawerToggle}
					iconElementRight={
						this.props.params.seasonId &&
						<IconMenu
							iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
							targetOrigin={{horizontal: 'right', vertical: 'top'}}
							anchorOrigin={{horizontal: 'right', vertical: 'top'}}
						>
						{this.props.params.seasonId && !this.props.params.gameId && 
							<MenuItem containerElement={<Link to={'/season/' + this.props.params.seasonId + '/edit'} />}>Edit Details</MenuItem>
						}
						{this.props.params.seasonId && this.props.params.gameId && 
							<MenuItem containerElement={<Link to={'/season/' + this.props.params.seasonId + '/game/' + this.props.params.gameId + '/edit'} />}>Edit Details</MenuItem>
						}
						</IconMenu>
					}
					style={{position: 'fixed'}}
				/>
				<main style={{paddingTop: 64}}>{React.cloneElement(this.props.children, {...this.state, handleChange: this.handleChange})}</main>
			</div>
		);
	},
});