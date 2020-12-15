/**
 * Providers
 *
 * Page to add/edit providers to the tool
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-15
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useRef, useState, useEffect } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import HttpsIcon from '@material-ui/icons/Https';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import VpnKeyIcon from '@material-ui/icons/VpnKey';

// Composites
import Permissions from './Permissions';

// Format Components
import ResultsComponent from '../../format/Results';
import FormComponent from '../../format/Form';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import Tools from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

// Provider Definition
import ProviderDef from '../../../definitions/providers/provider_memo';

// Data
import Divisions from '../../../definitions/divisions';
const _states = Tools.omap(Divisions['US'], (v,k) => [k,v]);

// Set the options for the ed and hrt practice states
ProviderDef['practiceStates']['__react__']['options'] = _states
ProviderDef['hrtPracticeStates']['__react__']['options'] = _states

// Generate the provider Tree
const ProviderTree = new Tree(ProviderDef);

/**
 * Providers
 *
 * Lists all providers in the system with the ability to edit their permissions and
 * password as well as add new providers
 *
 * @name Providers
 * @extends React.Component
 */
export default function Providers(props) {

	// State
	let [providers, providersSet] = useState(null);
	let [create, createSet] = useState(false);
	let [memo, memoSet] = useState(false);
	let [password, passwordSet] = useState(false);
	let [permissions, permissionsSet] = useState(false);

	// Refs
	let memoRef = useRef();
	let passwdRef = useRef();
	let permsRef = useRef();

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetchProviders();
		} else {
			providersSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	function createSuccess(provider) {
		providersSet(providers => {
			let ret = Tools.clone(providers);
			ret.unshift(provider);
			return ret;
		});
		createSet(false);
	}

	// Fetch all the providers from the server
	function fetchProviders() {

		// Fetch all providers
		Rest.read('providers', 'providers', {}).done(res => {

			// If there's an error
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the providers
				providersSet(res.data);
			}
		});
	}

	function memoImport() {

		// Store the username
		let sUserName = memoRef.current.value.trim();

		// Import the memo user
		Rest.create('providers', 'provider/memo', {
			"userName": sUserName
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {
				if(res.data) {
					Events.trigger('success', 'Provider ' + sUserName + ' added');
					memoSet(false);
					fetchProviders();
				} else {
					Events.trigger('error', 'No such Memo user: ' + sUserName);
				}
			}
		});
	}

	function passwordUpdate() {

		// Update the provider's password
		Rest.update('providers', 'provider/passwd', {
			"provider_id": password,
			"passwd": passwdRef.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				Events.trigger('success', 'Password updated');
				passwordSet(false);
			}
		})
	}

	function permissionsShow(provider_id) {

		// Fetch the provider's permissions
		Rest.read('providers', 'provider/permissions', {
			"provider_id": provider_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the permissions
				permissionsSet({
					"_id": provider_id,
					"rights": res.data
				});
			}
		});
	}

	function permissionsUpdate() {

		// Update the provider's permissions
		Rest.update('providers', 'provider/permissions', {
			"provider_id": permissions._id,
			"permissions": permsRef.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Hide permissions dialog
				permissionsSet(false);

				// Notify success
				Events.trigger('success', 'Permissions updated');
			}
		});
	}

	// Remove a provider
	function removeProvider(_id) {

		// Use the current providers to set the new providers
		providersSet(providers => {

			// Clone the providers
			let ret = Tools.clone(providers);

			// Find the index
			let iIndex = Tools.afindi(ret, '_id', _id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new providers
			return ret;
		});
	}

	// Return the rendered component
	return (
		<div id="providers">
			<div className="providers">
				<Box className="pageHeader">
					<Typography className="title">Providers</Typography>
					{Utils.hasRight(props.user, 'providers', 'create') &&
						<React.Fragment>
							<Tooltip title="Import Memo User">
								<IconButton onClick={ev => memoSet(b => !b)}>
									<PersonAddIcon />
								</IconButton>
							</Tooltip>
							<Tooltip title="Create New Provider">
								<IconButton onClick={ev => createSet(b => !b)}>
									<AddCircleIcon />
								</IconButton>
							</Tooltip>
						</React.Fragment>
					}
				</Box>
				{create &&
					<Paper className="padded">
						<FormComponent
							cancel={ev => createSet(b => !b)}
							errors={{
								1501: "Username already in use",
								1502: "Password not strong enough"
							}}
							noun="provider"
							service="providers"
							success={createSuccess}
							title="Create New"
							tree={ProviderTree}
							type="create"
						/>
					</Paper>
				}

				{providers === null ?
					<div>Loading...</div>
				:
					<ResultsComponent
						actions={[
							{"tooltip": "Edit Provider's permissions", "icon": HttpsIcon, "callback": permissionsShow},
							{"tooltip": "Change Provider's password", "icon": VpnKeyIcon, "callback": provider_id => passwordSet(provider_id)}
						]}
						data={providers}
						errors={{
							1501: "Username already in use",
						}}
						noun="provider"
						orderBy="userName"
						remove={Utils.hasRight(props.user, 'providers', 'delete') ? removeProvider : false}
						service="providers"
						tree={ProviderTree}
						update={Utils.hasRight(props.user, 'providers', 'update')}
					/>
				}
				{permissions &&
					<Dialog
						aria-labelledby="confirmation-dialog-title"
						maxWidth="lg"
						onClose={ev => permissionsSet(false)}
						open={true}
					>
						<DialogTitle id="permissions-dialog-title">Update Permissions</DialogTitle>
						<DialogContent dividers>
							<Permissions
								ref={permsRef}
								value={permissions.rights}
							/>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={ev => permissionsSet(false)}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={permissionsUpdate}>
								Update
							</Button>
						</DialogActions>
					</Dialog>
				}
				{password &&
					<Dialog
						aria-labelledby="confirmation-dialog-title"
						maxWidth="lg"
						onClose={() => passwordSet(false)}
						open={true}
					>
						<DialogTitle id="password-dialog-title">Update Password</DialogTitle>
						<DialogContent dividers>
							<TextField
								label="New Password"
								inputRef={passwdRef}
							/>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={() => passwordSet(false)}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={passwordUpdate}>
								Update
							</Button>
						</DialogActions>
					</Dialog>
				}
				{memo &&
					<Dialog
						aria-labelledby="memo-dialog-title"
						maxWidth="lg"
						onClose={ev => memoSet(false)}
						open={true}
					>
						<DialogTitle id="memo-dialog-title">Import Memo User</DialogTitle>
						<DialogContent dividers>
							<TextField
								label="User Name"
								inputRef={memoRef}
							/>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" color="secondary" onClick={ev => memoSet(false)}>
								Cancel
							</Button>
							<Button variant="contained" color="primary" onClick={memoImport}>
								Import User
							</Button>
						</DialogActions>
					</Dialog>
				}
			</div>
		</div>
	);
}
