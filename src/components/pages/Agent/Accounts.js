/**
 * Agents
 *
 * Page to add/edit agents to the tool
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-07
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';
import Tree from 'format-oc/Tree'

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
import Permissions from './Accounts_Permissions';

// Format Components
import { Form, Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Agent Definition
import AgentDef from 'definitions/csr/agent_memo';

// Generate the agent Tree
const AgentTree = new Tree(AgentDef);

/**
 * Agents
 *
 * Lists all agents in the system with the ability to edit their permissions and
 * password as well as add new agents
 *
 * @name Agents
 * @extends React.Component
 */
export default function Agents(props) {

	// State
	let [agents, agentsSet] = useState(null);
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
			agentsFetch();
		} else {
			agentsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	function createSuccess(agent) {
		agentsSet(agents => {
			let ret = clone(agents);
			ret.unshift(agent);
			return ret;
		});
		createSet(false);
	}

	// Fetch all the agents from the server
	function agentsFetch() {

		// Fetch all agents
		Rest.read('csr', 'agents', {}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the agents
				agentsSet(res.data);
			}
		});
	}

	function memoImport() {

		// Store the username
		let sUserName = memoRef.current.value.trim();

		// Import the memo user
		Rest.create('csr', 'agent/memo', {
			"userName": sUserName
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {
				if(res.data) {
					Events.trigger('success', 'Agent ' + sUserName + ' added');
					memoSet(false);
					agentsFetch();
				} else {
					Events.trigger('error', 'No such Memo user: ' + sUserName);
				}
			}
		});
	}

	function passwordUpdate() {

		// Update the agent's password
		Rest.update('csr', 'agent/passwd', {
			"agent_id": password,
			"passwd": passwdRef.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				Events.trigger('success', 'Password updated');
				passwordSet(false);
			}
		});
	}

	function permissionsShow(agent_id) {

		// Fetch the agent's permissions
		Rest.read('csr', 'agent/permissions', {
			"agent_id": agent_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the permissions
				permissionsSet({
					"_id": agent_id,
					"rights": res.data
				});
			}
		});
	}

	function permissionsUpdate() {

		// Update the agent's permissions
		Rest.update('csr', 'agent/permissions', {
			"agent_id": permissions._id,
			"permissions": permsRef.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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

	// Remove a agent
	function removeAgent(_id) {

		// Use the current agents to set the new agents
		agentsSet(agents => {

			// Clone the agents
			let ret = clone(agents);

			// Find the index
			let iIndex = afindi(ret, '_id', _id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new agents
			return ret;
		});
	}

	// Return the rendered component
	return (
		<Box id="agents" className="page flexGrow">
			<Box className="page_header">
				<Typography className="title">Agents</Typography>
				{Rights.has('csr_agents', 'create') &&
					<React.Fragment>
						<Tooltip title="Import Memo User">
							<IconButton onClick={ev => memoSet(b => !b)}>
								<PersonAddIcon />
							</IconButton>
						</Tooltip>
						<Tooltip title="Create New Agent">
							<IconButton onClick={ev => createSet(b => !b)}>
								<AddCircleIcon />
							</IconButton>
						</Tooltip>
					</React.Fragment>
				}
			</Box>
			{create &&
				<Paper className="padded">
					<Form
						cancel={ev => createSet(b => !b)}
						errors={{
							1501: "Username already in use",
							1502: "Password not strong enough"
						}}
						noun="agent"
						service="csr"
						success={createSuccess}
						title="Create New"
						tree={AgentTree}
						type="create"
					/>
				</Paper>
			}

			{agents === null ?
				<Box>Loading...</Box>
			:
				<Results
					actions={[
						{"tooltip": "Edit Agent's permissions", "icon": HttpsIcon, "callback": permissionsShow},
						{"tooltip": "Change Agent's password", "icon": VpnKeyIcon, "callback": agent_id => passwordSet(agent_id)}
					]}
					data={agents}
					errors={{
						1501: "Username already in use",
					}}
					noun="agent"
					orderBy="userName"
					remove={Rights.has('csr_agents', 'delete') ? removeAgent : false}
					service="csr"
					tree={AgentTree}
					update={Rights.has('csr_agents', 'update')}
				/>
			}
			{permissions &&
				<Dialog
					aria-labelledby="permissions-dialog-title"
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
					onClose={ev => passwordSet(false)}
					open={true}
				>
					<DialogTitle id="confirmation-dialog-title">Update Password</DialogTitle>
					<DialogContent dividers>
						<TextField
							label="New Password"
							inputRef={passwdRef}
						/>
					</DialogContent>
					<DialogActions>
						<Button variant="contained" color="secondary" onClick={ev => passwordSet(false)}>
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
		</Box>
	);
}

// Valid props
Agents.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}