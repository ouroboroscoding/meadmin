/**
 * Header
 *
 * Handles app bar and drawer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// NPM modules
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Material UI
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import EmailIcon from '@material-ui/icons/Email';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import GroupIcon from '@material-ui/icons/Group';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
import MenuIcon from '@material-ui/icons/Menu';
import PeopleIcon from '@material-ui/icons/People';

// Site components
import Loader from './Loader';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Local modules
import Utils from 'utils';

// Header component
export default function Header(props) {

	// State
	let [menu, menuSet] = useState(false);

	// Show/Hide menu
	function menuToggle() {
		menuSet(val => !val);
	}

	// Signout of app
	function signout(ev) {

		// Call the signout
		Rest.create('auth', 'signout', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.serviceError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Reset the session
				Rest.session(null);

				// Trigger the signedOut event
				Events.trigger('signedOut');
			}
		});
	}

	// Render
	return (
		<div id="header">
			<div className="bar">
				<IconButton edge="start" color="inherit" aria-label="menu" onClick={menuToggle}>
					<MenuIcon />
				</IconButton>
				<div><Typography className="title">
					<Link to="/" onClick={menuToggle}>{props.mobile ? 'ME Admin' : 'Male Excel Admin'}</Link>
				</Typography></div>
				<div id="loaderWrapper">
					<Loader />
				</div>
				{props.user &&
					<Tooltip title="Sign Out">
						<IconButton onClick={signout}>
							<ExitToAppIcon />
						</IconButton>
					</Tooltip>
				}
			</div>
			<Drawer
				anchor="left"
				id="menu"
				open={menu}
				onClose={menuToggle}
			>
				<List>
					{Utils.hasRight(props.user, 'csr_agents', 'read') &&
						<Link to="/agents" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><PeopleIcon /></ListItemIcon>
								<ListItemText primary="Agents (CSR)" />
							</ListItem>
						</Link>
					}
					{Utils.hasRight(props.user, 'providers', 'read') &&
						<Link to="/providers" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><LocalHospitalIcon /></ListItemIcon>
								<ListItemText primary="Providers" />
							</ListItem>
						</Link>
					}
					{Utils.hasRight(props.user, 'report_recipients', 'read') &&
						<Link to="/reports" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><EmailIcon /></ListItemIcon>
								<ListItemText primary="Report Recipients" />
							</ListItem>
						</Link>
					}
					{Utils.hasRight(props.user, 'user', 'read') &&
						<Link to="/users" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><GroupIcon /></ListItemIcon>
								<ListItemText primary="Users" />
							</ListItem>
						</Link>
					}
				</List>
			</Drawer>
		</div>
	);
}
