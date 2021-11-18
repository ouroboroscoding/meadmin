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
const ActionsTree = new Tree({
	__name__: 'TicketActions',
	name: {__type__: 'string'},
	hide: {__type__: 'uint', __react__: {title: 'Hide'}}
})

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
			end: range[1]
		}

		// If we have an agent
		if(agents !== '0') {
			oData.agent_type = agents;
		}

		// Fetch the counts from the server
		Rest.read('csr', 'stats/totals', oData).done(res => {

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
				countsSet(res.data);
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
					{counts.length === 0 ?
						<Typography>No counts</Typography>
					:
						<Results
							data={counts}
							noun=""
							orderBy="name"
							remove={false}
							service=""
							totals={true}
							tree={ActionsTree}
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
