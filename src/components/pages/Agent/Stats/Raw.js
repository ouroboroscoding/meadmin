/**
 * Raw Stats
 *
 * Page to view stats by range and agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-10-19
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Shared Components
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, date, nicePhone, omap, sortByKey } from 'shared/generic/tools';

// Action Definition
import ActionDef from 'definitions/csr/action';

// Generate the ticket Tree
const ActionTree = new Tree(clone(ActionDef));

// Get the type options
const TYPES = ActionDef.type.__react__.options.reduce((o, l) => Object.assign(o, {[l[0]]: l[1]}), {});

/**
 * Raw
 *
 * Lists all actions
 *
 * @name Raw
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Raw(props) {

	// State
	let [agent, agentSet] = useState('0');
	let [agents, agentsSet] = useState([]);
	let [counts, countsSet] = useState(false);
	let [range, rangeSet] = useState(null);
	let [actions, actionsSet] = useState(false);

	// Refs
	let refStart = useRef();
	let refEnd = useRef();

	// Load effect
	useEffect(() => {
		Rest.read('csr', 'agent/names').done(res => {
			agentsSet(res.data);
		});
	}, []);

	// Date range change
	useEffect(() => {
		if(range) {
			actionsFetch()
		} else {
			actionsSet(false);
		}
	// eslint-disable-next-line
	}, [range]);

	// Calculates the totals by opened type for actions
	function countsCalculate(actions) {

		// Init the counts by type
		let oCounts = {}

		// Go through each ticket
		for(let o of actions) {

			// If we don't have the type
			if(!(o.type in oCounts)) {
				oCounts[o.type] = 0;
			}

			// Increment the count
			++oCounts[o.type];
		}

		// Create a list from the type and count
		let lCounts = omap(oCounts, (i,k) => {
			return {type: k, count: i}
		});

		// Sort it alphabetically by type
		lCounts.sort(sortByKey('type'));

		// Store the new list
		countsSet(lCounts);
	}

	// Converts the start and end dates into timestamps
	function rangeUpdate() {

		// Convert the start and end into timestamps
		let iStart = (new Date(refStart.current.value + ' 00:00:00')).getTime() / 1000;
		let iEnd = (new Date(refEnd.current.value + ' 23:59:59')).getTime() / 1000;

		// Set the new range
		rangeSet([iStart, iEnd]);
	}

	// Get the actions
	function actionsFetch() {

		// Init the data
		let oData = {
			start: range[0],
			end: range[1]
		}

		// If we have an agent
		if(agent !== '0') {

			// If it's an individual agent
			if(agent.substr(0,3) === 'id_') {
				oData.memo_id = parseInt(agent.substr(3), 10);
			}

			// Else if it's a type of agents
			else if(agent.substr(0,5) === 'type_') {
				oData.agent_type = agent.substr(5);
			}
		}

		// Fetch the actions from the server
		Rest.read('csr', 'actions', oData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data
			if(res.data) {

				// Calculate the totals
				countsCalculate(res.data);

				// Set the actions
				actionsSet(res.data);
			}
		});
	}

	// Remove a ticket
	function removeAction(_id) {

		// Find the index
		let iIndex = afindi(actions, '_id', _id);

		// If one is found
		if(iIndex > -1) {

			// Clone the existing actions
			let lActions = clone(actions);

			// Remove the record
			lActions.splice(iIndex, 1);

			// Set the new actions
			actionsSet(lActions);
		}
	}

	// Generate today date
	let sToday = date(new Date(), '-');

	// If we have counts
	let CellPercentage = 0.0;
	if(counts) {
		CellPercentage = (Math.round((100 / counts.length) * 100) / 100) + '%';
	}

	// Return the rendered component
	return (
		<Box id="agentActions" className="page" style={{marginTop: '20px'}}>
			<Box className="filter">
				<TextField
					defaultValue={sToday}
					inputRef={refStart}
					inputProps={{
						min: '2021-05-01',
						max: sToday
					}}
					label="Start"
					size="small"
					type="date"
					variant="outlined"
					InputLabelProps={{ shrink: true }}
				/>
				<Typography>-</Typography>
				<TextField
					defaultValue={sToday}
					inputRef={refEnd}
					inputProps={{
						min: '2021-05-01',
						max: sToday
					}}
					label="End"
					size="small"
					type="date"
					variant="outlined"
					InputLabelProps={{ shrink: true }}
				/>
				<Typography>&nbsp;</Typography>
				<FormControl size="small" variant="outlined">
					<InputLabel htmlFor="filter-agent" style={{backgroundColor: 'white', padding: '0 5px'}}>Agent</InputLabel>
					<Select
						inputProps={{
							id: 'filter-agent'
						}}
						native
						onChange={ev => agentSet(ev.target.value)}
						value={agent}
					>
						<option value="0">All</option>
						<optgroup label="By Type">
							<option value="type_agent">CS Agents</option>
							<option value="type_pa">Provider Assistants</option>
							<option value="type_on_hrt">HRT Onboarders</option>
						</optgroup>
						<optgroup label="Individual Agents">
							{agents.map(o =>
								<option key={o.memo_id} value={'id_' + o.memo_id}>{o.firstName + ' ' + o.lastName}</option>
							)}
						</optgroup>
					</Select>
				</FormControl>
				<Button
					color="primary"
					onClick={rangeUpdate}
					variant="contained"
				>Fetch</Button>
			</Box>
			{counts &&
				<Table stickyHeader>
					<TableHead>
						<TableRow>{counts.map((o,i) => <TableCell key={i} style={{width: CellPercentage}}>{TYPES[o.type]}</TableCell>)}</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>{counts.map((o,i) => <TableCell key={i}>{o.count}</TableCell>)}</TableRow>
					</TableBody>
				</Table>
			}
			{actions &&
				<Box className="actions">
					{actions.length === 0 ?
						<Typography>No actions</Typography>
					:
						<Results
							custom={{
								memo_id: row => row.action_by,
								phone_number: row => <a href={'https://' + process.env.REACT_APP_MECSR_DOMAIN + '/view/' + row.phone_number + '/' + (row.crm_id || '0')} target="_blank" rel="noreferrer">{nicePhone(row.phone_number)}</a>,
								crm_id: row => <a href={'https://' + process.env.REACT_APP_MECSR_DOMAIN + '/view/' + row.phone_number + '/' + (row.crm_id || '0')} target="_blank" rel="noreferrer">{row.crm_id}</a>
							}}
							data={actions}
							noun="action"
							orderBy="_created"
							remove={Rights.has('csr_overwrite', 'delete') ? removeAction : false}
							service="csr"
							tree={ActionTree}
							update={false}
						/>
					}
				</Box>
			}
		</Box>
	);
}

// Valid props
Raw.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
