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
import Box from '@material-ui/core/Box';
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
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import ConfirmationNumberIcon from '@material-ui/icons/ConfirmationNumber';
import DescriptionIcon from '@material-ui/icons/Description';
import EmailIcon from '@material-ui/icons/Email';
import ErrorIcon from '@material-ui/icons/Error';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import EventIcon from '@material-ui/icons/Event';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import HeadsetMicIcon from '@material-ui/icons/HeadsetMic';
import GroupIcon from '@material-ui/icons/Group';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import LinkIcon from '@material-ui/icons/Link';
import LocalPharmacyIcon from '@material-ui/icons/LocalPharmacy';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
import MenuIcon from '@material-ui/icons/Menu';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import PeopleIcon from '@material-ui/icons/People';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import SpeakerNotesIcon from '@material-ui/icons/SpeakerNotes';
import TodayIcon from '@material-ui/icons/Today';

// Site components
import Account from './Account';
import Loader from './Loader';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone, safeLocalStorageJSON } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

// No Rights
const _NO_RIGHTS = {
	calendly_admin: false,
	csr_agents: false,
	csr_overwrite: false,
	documentation: false,
	link: false,
	providers: false,
	report_recipients: false,
	rx_product: false,
	user: false
}

// Header component
export default function Header(props) {

	// State
	let [account, accountSet] = useState(false);
	let [menu, menuSet] = useState(false);
	let [rights, rightsSet] = useState(_NO_RIGHTS);
	let [subs, subsSet] = useState(safeLocalStorageJSON('submenu', {}))

	// User effect
	useEffect(() => {
		rightsSet(props.user ? {
			calendly_admin: Rights.has('calendly_admin', 'read'),
			csr_agents: Rights.has('csr_agents', 'read'),
			csr_overwrite: Rights.has('csr_overwrite', 'read'),
			documentation: Rights.has('documentation', 'update'),
			link: Rights.has('link', 'read'),
			providers: Rights.has('providers', 'read'),
			prov_overwrite: Rights.has('prov_overwrite', 'read'),
			report_recipients: Rights.has('report_recipients', 'read'),
			rx_product: Rights.has('rx_product', 'read'),
			user: Rights.has('user', 'read')
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
				Events.trigger('error', Rest.errorMessage(res.error));
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

	// Toggles sub-menus and stores the state in local storage
	function subMenuToggle(name) {

		// Clone the current subs
		let oSubs = clone(subs);

		// If the name exists, delete it
		if(oSubs[name]) {
			delete oSubs[name];
		}
		// Else, add it
		else {
			oSubs[name] = true;
		}

		// Store the value in storage
		localStorage.setItem('submenu', JSON.stringify(oSubs));

		// Update the state
		subsSet(oSubs);
	}

	// Render
	return (
		<Box id="header">
			<Box className="bar">
				<IconButton edge="start" color="inherit" aria-label="menu" onClick={menuToggle}>
					<MenuIcon />
				</IconButton>
				<Box><Typography className="title">
					<Link to="/" onClick={menuToggle}>{props.mobile ? 'ME Admin' : 'Male Excel Admin'}</Link>
				</Typography></Box>
				<Box id="loaderWrapper">
					<Loader />
				</Box>
				{props.user &&
					<React.Fragment>
						<Tooltip title="Account">
							<IconButton onClick={ev => accountSet(b => !b)}>
								<PermIdentityIcon />
							</IconButton>
						</Tooltip>
						<Tooltip title="Sign Out">
							<IconButton onClick={signout}>
								<ExitToAppIcon />
							</IconButton>
						</Tooltip>
					</React.Fragment>
				}
			</Box>
			<Drawer
				anchor="left"
				id="menu"
				open={menu}
				onClose={menuToggle}
			>
				<List>
					{(rights.csr_agents || rights.csr_overwrite) &&
						<React.Fragment>
							<ListItem button key="Agents" onClick={ev => subMenuToggle('agent')}>
								<ListItemIcon><HeadsetMicIcon /></ListItemIcon>
								<ListItemText primary="Agents" />
								{subs.agent ? <ExpandLess /> : <ExpandMore />}
							</ListItem>
							<Collapse in={subs.agent || false} timeout="auto" unmountOnExit>
								<List component="div" className="submenu">
									{rights.csr_agents &&
										<Link to="/agent/accounts" onClick={menuToggle}>
											<ListItem button>
												<ListItemIcon><PeopleIcon /></ListItemIcon>
												<ListItemText primary="Accounts" />
											</ListItem>
										</Link>
									}
									{rights.csr_overwrite &&
										<React.Fragment>
											<Link to="/agent/claims" onClick={menuToggle}>
												<ListItem button>
													<ListItemIcon><SpeakerNotesIcon /></ListItemIcon>
													<ListItemText primary="Claims" />
												</ListItem>
											</Link>
											<Link to="/agent/tickets" onClick={menuToggle}>
												<ListItem button>
													<ListItemIcon><ConfirmationNumberIcon /></ListItemIcon>
													<ListItemText primary="Tickets" />
												</ListItem>
											</Link>
										</React.Fragment>
									}
								</List>
							</Collapse>
						</React.Fragment>
					}
					{rights.calendly_admin &&
						<React.Fragment>
							<ListItem button key="Calendly" onClick={ev => subMenuToggle('calendly')}>
								<ListItemIcon><TodayIcon /></ListItemIcon>
								<ListItemText primary="Calendly" />
								{subs.calendly ? <ExpandLess /> : <ExpandMore />}
							</ListItem>
							<Collapse in={subs.calendly || false} timeout="auto" unmountOnExit>
								<List component="div" className="submenu">
									<Link to="/calendly/events" onClick={menuToggle}>
										<ListItem button>
											<ListItemIcon><EventIcon /></ListItemIcon>
											<ListItemText primary="Events (Rooms)" />
										</ListItem>
									</Link>
								</List>
							</Collapse>
						</React.Fragment>
					}
					{rights.link &&
						<Link to="/links" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><LinkIcon /></ListItemIcon>
								<ListItemText primary="Links" />
							</ListItem>
						</Link>
					}
					{rights.rx_product &&
						<React.Fragment>
							<ListItem button key="Pharmacy" onClick={ev => subMenuToggle('pharmacy')}>
								<ListItemIcon><LocalPharmacyIcon /></ListItemIcon>
								<ListItemText primary="Pharmacy" />
								{subs.pharmacy ? <ExpandLess /> : <ExpandMore />}
							</ListItem>
							<Collapse in={subs.pharmacy || false} timeout="auto" unmountOnExit>
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
						<React.Fragment>
							<ListItem button key="Pharmacy" onClick={ev => subMenuToggle('provider')}>
								<ListItemIcon><LocalHospitalIcon /></ListItemIcon>
								<ListItemText primary="Providers" />
								{subs.provider ? <ExpandLess /> : <ExpandMore />}
							</ListItem>
							<Collapse in={subs.provider || false} timeout="auto" unmountOnExit>
								<List component="div" className="submenu">
									<Link to="/provider/accounts" onClick={menuToggle}>
										<ListItem button>
											<ListItemIcon><PeopleIcon /></ListItemIcon>
											<ListItemText primary="Accounts" />
										</ListItem>
									</Link>
								</List>
								<List component="div" className="submenu">
									<Link to="/provider/stats" onClick={menuToggle}>
										<ListItem button>
											<ListItemIcon><AccessTimeIcon /></ListItemIcon>
											<ListItemText primary="Stats" />
										</ListItem>
									</Link>
								</List>
								<List component="div" className="submenu">
									<Link to="/provider/pending" onClick={menuToggle}>
										<ListItem button>
											<ListItemIcon><MonetizationOnIcon /></ListItemIcon>
											<ListItemText primary="Pending Orders" />
										</ListItem>
									</Link>
								</List>
								{rights.prov_overwrite &&
									<List component="div" className="submenu">
										<Link to="/provider/claims" onClick={menuToggle}>
											<ListItem button>
												<ListItemIcon><SpeakerNotesIcon /></ListItemIcon>
												<ListItemText primary="Claims" />
											</ListItem>
										</Link>
									</List>
								}
							</Collapse>
						</React.Fragment>
					}
					{rights.report_recipients &&
						<Link to="/reports" onClick={menuToggle}>
							<ListItem button>
								<ListItemIcon><EmailIcon /></ListItemIcon>
								<ListItemText primary="Report Recipients" />
							</ListItem>
						</Link>
					}
					{rights.documentation &&
						<React.Fragment>
							<ListItem button key="REST Docs" onClick={ev => subMenuToggle('docs')}>
								<ListItemIcon><DescriptionIcon /></ListItemIcon>
								<ListItemText primary="REST Docs" />
								{subs.docs ? <ExpandLess /> : <ExpandMore />}
							</ListItem>
							<Collapse in={subs.docs || false} timeout="auto" unmountOnExit>
								<List component="div" className="submenu">
									<Link to="/documentation/services" onClick={menuToggle}>
										<ListItem button>
											<ListItemIcon><InsertDriveFileIcon /></ListItemIcon>
											<ListItemText primary="Services" />
										</ListItem>
									</Link>
									<Link to="/documentation/errors" onClick={menuToggle}>
										<ListItem button>
											<ListItemIcon><ErrorIcon /></ListItemIcon>
											<ListItemText primary="Errors" />
										</ListItem>
									</Link>
								</List>
							</Collapse>
						</React.Fragment>
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
			{account &&
				<Account
					onCancel={ev => accountSet(false)}
					user={props.user}
				/>
			}
		</Box>
	);
}

// Valid props
Header.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
