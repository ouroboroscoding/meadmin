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
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Material UI
import Collapse from '@material-ui/core/Collapse';
import Drawer from '@material-ui/core/Drawer';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
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
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import GroupIcon from '@material-ui/icons/Group';
import LocalPharmacyIcon from '@material-ui/icons/LocalPharmacy';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
import MenuIcon from '@material-ui/icons/Menu';
import PeopleIcon from '@material-ui/icons/People';
import SpeakerNotesIcon from '@material-ui/icons/SpeakerNotes';

// Site components
import Loader from './Loader';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { safeLocalStorageBool } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

// No Rights
const _NO_RIGHTS = {
	csr_agents: false,
	csr_overwrite: false,
	providers: false,
	report_recipients: false,
	rx_product: false,
	user: false
}

// Header component
export default function Header(props) {

	// State
	let [menu, menuSet] = useState(false);
	let [pharmacy, pharmacySet] = useState(safeLocalStorageBool('menuPharmacy'));
	let [rights, rightsSet] = useState(_NO_RIGHTS);

	// User effect
	useEffect(() => {
		rightsSet(props.user ? {
			csr_agents: Utils.hasRight(props.user, 'csr_agents', 'read'),
			csr_overwrite: Utils.hasRight(props.user, 'csr_overwrite', 'read'),
			providers: Utils.hasRight(props.user, 'providers', 'read'),
			report_recipients: Utils.hasRight(props.user, 'report_recipients', 'read'),
			rx_product: Utils.hasRight(props.user, 'rx_product', 'read'),
			user: Utils.hasRight(props.user, 'user', 'read')
		} : _NO_RIGHTS);
	}, [props.user])

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
					{rights.csr_agents &&
						<Link to="/agents" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><PeopleIcon /></ListItemIcon>
								<ListItemText primary="Agents" />
							</ListItem>
						</Link>
					}
					{rights.csr_overwrite &&
						<Link to="/claims/agent" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><SpeakerNotesIcon /></ListItemIcon>
								<ListItemText primary="Agent Claims" />
							</ListItem>
						</Link>
					}
					{rights.rx_product &&
						<React.Fragment>
							<ListItem button key="Pharmacy" onClick={ev => { pharmacySet(b => { localStorage.setItem('menuPharmacy', b ? '' : 'x'); return !b;})}}>
								<ListItemIcon><LocalPharmacyIcon /></ListItemIcon>
								<ListItemText primary="Pharmacy" />
								{pharmacy ? <ExpandLess /> : <ExpandMore />}
							</ListItem>
							<Collapse in={pharmacy} timeout="auto" unmountOnExit>
								<List component="div" className="submenu">
									<Link to="/pharmacy/products" onClick={menuToggle}>
										<ListItem button>
											<ListItemIcon><FormatListBulletedIcon /></ListItemIcon>
											<ListItemText primary="Product to NDC" />
										</ListItem>
									</Link>
								</List>
							</Collapse>
						</React.Fragment>
					}
					{rights.providers &&
						<Link to="/providers" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><LocalHospitalIcon /></ListItemIcon>
								<ListItemText primary="Providers" />
							</ListItem>
						</Link>
					}
					{rights.report_recipients &&
						<Link to="/reports" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><EmailIcon /></ListItemIcon>
								<ListItemText primary="Report Recipients" />
							</ListItem>
						</Link>
					}
					{rights.user &&
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

// Valid props
Header.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
