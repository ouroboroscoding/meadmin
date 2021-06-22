/**
 * Totals
 *
 * Page to view ticket totals by range and agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-06-22
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
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Shared Components
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { date } from 'shared/generic/tools';

// Generate the ticket Tree
const OpenedTree = new Tree({
	__name__: 'OpenedTickets',
	name: {__type__: 'string'},
	"Call": {__type__: 'uint'},
	"Follow_Up": {__type__: 'uint'},
	"Provider": {__type__: 'uint'},
	"Script_Entry": {__type__: 'uint'},
	"SMS___Voicemail": {__type__: 'uint', __react__: {title: 'SMS / Voicemail'}}
});
const ResolvedTree = new Tree({
	__name__: 'ResolvedTickets',
	name: {__type__: 'string'},
	"Contact_Attempted": {__type__: 'uint'},
	"Follow_Up_Complete": {__type__: 'uint'},
	"Information_Provided": {__type__: 'uint'},
	"Issue_Resolved": {__type__: 'uint'},
	"Provider_Confirmed Prescription": {__type__: 'uint'},
	"QA_Order_Declined": {__type__: 'uint'},
	"Recurring_Purchase_Canceled": {__type__: 'uint'},
	"Script_Entered": {__type__: 'uint'},
	"Invalid_Transfer: No Purchase Information": {__type__: 'uint'}
});

/**
 * Totals
 *
 * Lists all counts by agent
 *
 * @name Totals
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Totals(props) {

	// State
	let [agents, agentsSet] = useState('0');
	let [counts, countsSet] = useState(false);
	let [range, rangeSet] = useState(null);
	let [type, typeSet] = useState('opened');

	// Refs
	let refStart = useRef();
	let refEnd = useRef();

	// Date range change
	useEffect(() => {
		if(range) {
			countsFetch()
		} else {
			countsSet(false);
		}
	// eslint-disable-next-line
	}, [range]);

	// Converts the start and end dates into timestamps
	function rangeUpdate() {

		// Convert the start and end into timestamps
		let iStart = (new Date(refStart.current.value + ' 00:00:00')).getTime() / 1000;
		let iEnd = (new Date(refEnd.current.value + ' 23:59:59')).getTime() / 1000;

		// Set the new range
		rangeSet([iStart, iEnd]);
	}

	// Get the counts
	function countsFetch() {

		// Init the data
		let oData = {
			start: range[0],
			end: range[1],
			type: type
		}

		// If we have an agent
		if(agents !== '0') {
			oData.agent_type = agents;
		}

		// Fetch the counts from the server
		Rest.read('csr', 'ticket/stats/totals', oData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data
			if(res.data) {

				// Set the counts
				countsSet({
					type: type,
					records: res.data
				});
			}
		});
	}

	// Generate today date
	let sToday = date(new Date(), '-');

	// Return the rendered component
	return (
		<Box id="agentTicketTotals" className="page" style={{marginTop: '20px'}}>
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
					<InputLabel htmlFor="filter-type" style={{backgroundColor: 'white', padding: '0 5px'}}>Type</InputLabel>
					<Select
						inputProps={{
							id: 'filter-type'
						}}
						native
						onChange={ev => typeSet(ev.target.value)}
						value={type}
					>
						<option value="opened">Opened</option>
						<option value="resolved">Resolved</option>
					</Select>
				</FormControl>
				<Typography>&nbsp;</Typography>
				<FormControl size="small" variant="outlined">
					<InputLabel htmlFor="filter-agent" style={{backgroundColor: 'white', padding: '0 5px'}}>Agents</InputLabel>
					<Select
						inputProps={{
							id: 'filter-agent'
						}}
						native
						onChange={ev => agentsSet(ev.target.value)}
						value={agents}
					>
						<option value="0">All</option>
						<option value="agent">CS Agents</option>
						<option value="pa">Provider Assistants</option>
						<option value="on_hrt">HRT Onboarders</option>
					</Select>
				</FormControl>
				<Button
					color="primary"
					onClick={rangeUpdate}
					variant="contained"
				>Fetch</Button>
			</Box>
			{counts &&
				<Box className="counts">
					{counts.records.length === 0 ?
						<Typography>No counts</Typography>
					:
						<Results
							key={counts.type}
							data={counts.records}
							noun=""
							orderBy="name"
							remove={false}
							service=""
							totals={true}
							tree={counts.type === 'opened' ? OpenedTree : ResolvedTree}
							update={false}
						/>
					}
				</Box>
			}
		</Box>
	);
}

// Valid props
Totals.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
