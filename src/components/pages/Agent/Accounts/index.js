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
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import HttpsIcon from '@material-ui/icons/Https';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import QueryBuilderIcon from '@material-ui/icons/QueryBuilder';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import VpnKeyIcon from '@material-ui/icons/VpnKey';

// Composites
import Hours from './Hours';
import Permissions from './Permissions';

// Format Components
import { Form, Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, sortByKey } from 'shared/generic/tools';

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
	let [oof, oofSet] = useState(false);
	let [password, passwordSet] = useState(false);

	// Refs
	let memoRef = useRef();
	let oofRef = useRef();
	let passwdRef = useRef();

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

	// Remove a agent
	function agentRemove(_id) {

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

	// Update an agent
	function agentUpdate(agent) {

		// Find the agent
		let iIndex = afindi(agents, '_id', agent._id);

		// If it exists
		if(iIndex > -1) {

			// Clone the existing, update, and set the new state
			let lAgents = clone(agents);
			lAgents[iIndex] = agent;
			agentsSet(lAgents);
		}
	}

	// Called to create a new agent from an existing Memo user
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

	// Called when the oof action is clicked in the results row
	function oofAction(agent) {

		// Look the agent
		let iIndex = afindi(agents, '_id', agent._id);

		// If we have the agent
		if(iIndex > -1) {

			// If they're already in oof, turn it off
			if(agents[iIndex].oof) {
				oofUpdate(null, agents[iIndex]._id);
			}

			// Else, show the dialog
			else {
				oofSet(agent._id);
			}
		}
	}

	// Called to return the action data for the user in the Results
	function oofActionData(agent) {
		return {
			tooltip: agent.oof ? 'Remove Out Of Office' : 'Set Out Of Office',
			icon: agent.oof ? VisibilityOffIcon : VisibilityIcon,
			className: agent.oof ? 'oof_on' : 'oof_off'
		}
	}

	// Called to set the Out of Office replacement for the user
	function oofUpdate(ev, _id=null) {

		// Init the request data
		let oData = null;

		// If we got an ID we're turning it off
		if(_id) {
			oData = {
				_id: _id,
				oof: 0,
				oof_replacement: 0
			};
		}

		// Else, we're setting the replacement
		else {
			oData = {
				_id: oof,
				oof: 1,
				oof_replacement: oofRef.current.value
			}
		}

		// Send the request to the server
		Rest.update('csr', 'agent', oData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Hide the dialog
				oofSet(false);

				// Update the agents
				agentsSet(agents => {

					// Find the record
					let iIndex = afindi(agents, '_id', oData._id);

					// If we didn't find the agent
					if(iIndex === -1) {
						return agents;
					}

					// Update and return a clone
					agents[iIndex].oof = oData.oof;
					agents[iIndex].oof_replacement = oData.oof_replacement;
					return clone(agents);
				});
			}
		});
	}

	// Called to update the password for the user
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
								<AddCircleIcon className={(create ? 'open' : 'closed')} />
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
					actions={Rights.has('csr_agents', 'update') ? [
						{dynamic: oofActionData, callback: oofAction},
						{tooltip: "Edit Agent's Office Hours", icon: QueryBuilderIcon, component: Hours},
						{tooltip: "Edit Agent's permissions", icon: HttpsIcon, component: Permissions},
						{tooltip: "Change Agent's password", icon: VpnKeyIcon, callback: agent => passwordSet(agent._id)}
					] : null}
					data={agents}
					errors={{
						1501: "Username already in use",
					}}
					noun="agent"
					orderBy="userName"
					remove={Rights.has('csr_agents', 'delete') ? agentRemove : false}
					service="csr"
					tree={AgentTree}
					update={Rights.has('csr_agents', 'update') ? agentUpdate : false}
				/>
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
			{oof &&
				<Dialog
					aria-labelledby="oof-dialog-title"
					maxWidth="md"
					onClose={ev => oofSet(false)}
					open={true}
				>
					<DialogTitle id="oof-dialog-title">Set Out of Office</DialogTitle>
					<DialogContent dividers>
						<Typography>Please select another agent to handle customers</Typography>
						<Box className="field">
							<Select
								inputRef={oofRef}
								native
								variant="outlined"
							>
								{agents.sort(sortByKey('firstName')).map((o,i) =>
									<option key={i} value={o.memo_id}>{o.firstName} {o.lastName}</option>
								)}
							</Select>
						</Box>
					</DialogContent>
					<DialogActions>
						<Button variant="contained" color="secondary" onClick={ev => oofSet(false)}>
							Cancel
						</Button>
						<Button variant="contained" color="primary" onClick={oofUpdate}>
							Set Replacement
						</Button>
					</DialogActions>
				</Dialog>
			}
			{password &&
				<Dialog
					aria-labelledby="password-dialog-title"
					maxWidth="lg"
					onClose={ev => passwordSet(false)}
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
						<Button variant="contained" color="secondary" onClick={ev => passwordSet(false)}>
							Cancel
						</Button>
						<Button variant="contained" color="primary" onClick={passwordUpdate}>
							Update
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
