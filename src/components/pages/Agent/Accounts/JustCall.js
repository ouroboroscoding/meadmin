/**
 * JustCall
 *
 * Handles office hours of an agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-06-15
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * JustCall
 *
 * Handles the form to associated the JustCall user to the Memo user
 *
 * @name JustCall
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function JustCall(props) {

	// State
	let [agent, agentSet] = useState('0');
	let [agents, agentsSet] = useState([{agent_id: 0, firstName: 'Loading...', lastName: ''}]);

	// Load effect
	useEffect(() => {

		// Fetch the full list of IDs from JustCall
		Rest.read('justcall', 'users', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Update the state
				agentsSet(res.data);
			}
		});

		// Fetch the current Just ID for the agent
		Rest.read('justcall', 'agent/memo', {
			memo_id: props.value.memo_id
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

				// Update the state
				agentSet(res.data.agent_id);
			}
		});

	}, [props.value.memo_id]);

	// Called to update the hours for the agent
	function update() {

		// Send the data to the server
		Rest.update('justcall', 'agent/memo', {
			agent_id: parseInt(agent),
			memo_id: props.value.memo_id,
			index: 'memo_id'
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
				Events.trigger('success', 'JustCall Agent associated');
				props.onClose();
			}
		});
	}

	// Render
	return (
		<Box className="agentAccountsJustCall">
			<Select
				native
				onChange={ev => agentSet(ev.target.value)}
				value={agent}
				variant="outlined"
			>
				{agents.map(o =>
					<option key={o.agent_id} value={o.agent_id.toString()}>{o.firstName} {o.lastName}</option>
				)}
			</Select>
			<Box className="actions">
				<Button variant="contained" color="secondary" onClick={props.onClose}>Cancel</Button>
				<Button variant="contained" color="primary" onClick={update}>Update</Button>
			</Box>
		</Box>
	);
}

// Force props
JustCall.propTypes = {
	onClose: PropTypes.func.isRequired,
	value: PropTypes.object.isRequired
}
