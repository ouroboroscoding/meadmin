/**
 * HRT Orders
 *
 * Page to search/delete HRT orders that require a prescription
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-08-24
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';
import Tree from 'format-oc/Tree';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import ReportIcon from '@material-ui/icons/Report';

// Format Components
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, date } from 'shared/generic/tools';

// Definitions
import HrtOrderBase from 'definitions/prescriptions/hrt_order';
const HrtOrderDef = clone(HrtOrderBase);
HrtOrderDef.__react__ = {
	results: ['date', 'crm_id', 'crm_order', 'customerName', 'flagged', 'claimedName', 'state', 'stateName']
}
HrtOrderDef.customerName = {__type__: 'string', __react__: {title: 'Customer'}}
HrtOrderDef.claimedName = {__type__: 'string', __react__: {title: 'Claimed By'}}
HrtOrderDef.stateName = {__type__: 'string', __react__: {title: 'State By'}}

// Tree
const HrtOrderTree = new Tree(HrtOrderDef);

/**
 * HRT Orders
 *
 * Allows searching for hrt orders by range and optional fields
 *
 * @name HrtOrders
 * @extends React.Component
 */
export default function HrtOrders(props) {

	// State
	let [agents, agentsSet] = useState([]);
	let [claimedBy, claimedBySet] = useState('0');
	let [flagged, flaggedSet] = useState(0);
	let [results, resultsSet] = useState(false);
	let [state, stateSet] = useState('0');
	let [stateBy, stateBySet] = useState('0');

	// Refs
	let refStart = useRef();
	let refEnd = useRef();

	// Load effect
	useEffect(() => {
		agentsFetch();
	}, []);

	// Fetches the list of agents
	function agentsFetch() {
		Rest.read('csr', 'agent/names', {}).done(res => {
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}
			if(res.data) {
				agentsSet(res.data);
			}
		});
	}

	// Get the results
	function resultsFetch() {

		// Init the data
		let oData = {
			start: refStart.current.value,
			end: refEnd.current.value
		}

		// If we have flagged type
		if(flagged !== '0') {
			oData.flagged = flagged === 'true';
		}

		// If we have a claimed agent
		if(claimedBy !== '0') {
			oData.claimed_by = claimedBy;
		}

		// If we have a state
		if(state !== '0') {
			oData.state = state;
		}

		// If we have a state agent
		if(stateBy !== '0') {
			oData.state_by = stateBy;
		}

		// Fetch the results from the server
		Rest.read('prescriptions', 'hrt/order/search', oData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data
			if(res.data) {

				// Set the results
				resultsSet(res.data);
			}
		});
	}

	// Remove a result
	function resultRemoved(_id) {

		// Use the current results to set the new results
		resultsSet(results => {

			// Clone the results
			let ret = clone(results);

			// Find the index
			let iIndex = afindi(ret, '_id', _id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new results
			return ret;
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
					<InputLabel htmlFor="filter-state" style={{backgroundColor: 'white', padding: '0 5px'}}>Flagged</InputLabel>
					<Select
						inputProps={{
							id: 'filter-flagged'
						}}
						native
						onChange={ev => flaggedSet(ev.target.value)}
						value={flagged}
					>
						<option value="0">All</option>
						<option value="true">Flagged</option>
						<option value="false">Not Flagged</option>
					</Select>
				</FormControl>				<Typography>&nbsp;</Typography>
				<FormControl size="small" variant="outlined">
					<InputLabel htmlFor="filter-claimedBy" style={{backgroundColor: 'white', padding: '0 5px'}}>Claimed By</InputLabel>
					<Select
						inputProps={{
							id: 'filter-claimedBy'
						}}
						native
						onChange={ev => claimedBySet(ev.target.value)}
						value={claimedBy}
					>
						<option value="0">All</option>
						{agents.map(o =>
							<option key={o.memo_id} value={o.memo_id}>{o.firstName} {o.lastName}</option>
						)}
					</Select>
				</FormControl>
				<Typography>&nbsp;</Typography>
				<FormControl size="small" variant="outlined">
					<InputLabel htmlFor="filter-state" style={{backgroundColor: 'white', padding: '0 5px'}}>State</InputLabel>
					<Select
						inputProps={{
							id: 'filter-state'
						}}
						native
						onChange={ev => stateSet(ev.target.value)}
						value={state}
					>
						<option value="0">All</option>
						<option value="">(no state)</option>
						<option value="order_approved">Order Approved</option>
						<option value="rx_completed">RX Entered</option>
					</Select>
				</FormControl>
				<Typography>&nbsp;</Typography>
				<FormControl size="small" variant="outlined">
					<InputLabel htmlFor="filter-stateBy" style={{backgroundColor: 'white', padding: '0 5px'}}>State By</InputLabel>
					<Select
						inputProps={{
							id: 'filter-stateBy'
						}}
						native
						onChange={ev => stateBySet(ev.target.value)}
						value={stateBy}
					>
						<option value="0">All</option>
						{agents.map(o =>
							<option key={o.memo_id} value={o.memo_id}>{o.firstName} {o.lastName}</option>
						)}
					</Select>
				</FormControl>
				<Button
					color="primary"
					onClick={resultsFetch}
					variant="contained"
				>Fetch</Button>
			</Box>
			{results &&
				<Box className="results">
					{results.length === 0 ?
						<Typography>No results</Typography>
					:
						<Results
							custom={{
								flagged: order => {
									return order.flagged ?
											<ReportIcon color="secondary" />
											:
											'';
								}
							}}
							data={results}
							noun="hrt/order"
							orderBy="date"
							remove={Rights.has('rx_hrt_order', 'delete') ? resultRemoved : false}
							service="prescriptions"
							tree={HrtOrderTree}
							update={false}
						/>
					}
				</Box>
			}
		</Box>
	);
}

// Valid props
HrtOrders.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
