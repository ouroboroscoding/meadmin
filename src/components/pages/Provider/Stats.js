/**
 * Provider Stats
 *
 * Page to add/edit providers to the tool
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-15
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';
import Parent from 'format-oc/Parent';
import Tree from 'format-oc/Tree';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import ListIcon from '@material-ui/icons/List';

// Format Components
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindo, clone, date, dateInc, datetime, safeLocalStorage } from 'shared/generic/tools';

// Definitions
import TrackingDef from 'definitions/providers/tracking';

const ProviderTracking = clone(TrackingDef);
ProviderTracking.__react__ = {
	results: ['action', 'action_ts', 'resolution', 'resolution_ts', 'time', 'crm_id']
};
ProviderTracking.action_ts = {__type__: 'string', __react__: {title: 'Start'}}
ProviderTracking.resolution_ts = {__type__: 'string', __react__: {title: 'End'}}
ProviderTracking.time = {__type__: 'string', __react__: {title: 'Elapsed'}};
ProviderTracking.crm_id.__react__ = {title: 'Customer ID'};

// Generate the tree for the results component
const StatsParent = new Parent({
	__react__: {
		primary: 'memoId',
		results: ['firstName', 'lastName', 'hours', 'approvals', 'declines', 'average']
	},
	memoId: {__type__: 'uint'},
	firstName: {__type__: 'string', __react__: {title: 'First'}},
	lastName: {__type__: 'string', __react__: {title: 'Last'}},
	hours: {__type__: 'string'},
	approvals: {__type__: 'uint'},
	declines: {__type__: 'uint'},
	average: {__type__: 'string'}
});

const TrackingTree = new Tree(ProviderTracking)

/**
 * Stats
 *
 * Returns breakdown of provider worked hours
 *
 * @name Stats
 * @extends React.Component
 */
export default function Stats(props) {

	// State
	let [dialog, dialogSet] = useState(false);
	let [filter, filterSet] = useState(safeLocalStorage('providerStatsFilter', 'all'));
	let [filtered, filteredSet] = useState([]);
	let [range, rangeSet] = useState(null);
	let [results, resultsSet] = useState(false)

	// Refs
	let refStart = useRef();
	let refEnd = useRef();

	// Date range change
	useEffect(() => {
		if(range) {
			resultsFetch()
		} else {
			resultsSet(false);
		}
	// eslint-disable-next-line
	}, [range]);

	// Breakdown or filter change
	useEffect(() => {
		if(dialog && dialog.results) {
			if(filter === 'all') {
				filteredSet(dialog.results);
			} else {
				filterDialogResults(filter);
			}
		} else {
			filteredSet([]);
		}
	// eslint-disable-next-line
	}, [dialog, filter])

	// Show individual provider breakdown
	function breakdownShow(id) {

		// Find the record associated with the ID
		let oStat = afindo(results, 'memoId', id);

		// Init the new dialog value
		let oDialog = {
			name: oStat.firstName + ' ' + oStat.lastName,
			results: 0
		};

		// Display the dialog
		dialogSet(oDialog);

		// Make the request to the server for the results
		Rest.read('providers', 'provider/tracking', {
			memo_id: id,
			start: range[0],
			end: range[1]
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data
			if(res.data) {

				// Go through each record and convert the timestamps to dates
				for(let o of res.data) {
					o.action_ts = o.action_ts ? datetime(o.action_ts, '-') : '';
					o.resolution_ts = o.resolution_ts ? datetime(o.resolution_ts, '-') : '';
				}

				let oNewDialog = clone(oDialog);
				oNewDialog.results = res.data;
				dialogSet(oNewDialog);
			}
		});
	}

	// Called when either the dialog results or filter is changed
	function filterDialogResults(filter) {
		let lResults = [];
		for(let o of dialog.results) {
			if(o.action === filter) {
				lResults.push(o);
			}
		}
		filteredSet(lResults);
	}

	// Converts the start and end dates into timestamps
	function rangeUpdate() {

		// Convert the start and end into timestamps
		let iStart = (new Date(refStart.current.value + ' 00:00:00')).getTime() / 1000;
		let iEnd = (new Date(refEnd.current.value + ' 23:59:59')).getTime() / 1000;

		// Set the new range
		rangeSet([iStart, iEnd]);
	}

	// Get the hours by provider for the given start/end
	function resultsFetch() {

		// Fetch the results from the server
		Rest.read('providers', 'hours', {
			start: range[0],
			end: range[1]
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data
			if(res.data) {
				resultsSet(res.data);
			}
		})
	}

	// Generate today date
	let sToday = date(new Date(), '-');

	// Render
	return (
		<Box id="providerStats">
			<Box className="page_header">
				<Typography className="title">Provider Stats</Typography>
			</Box>
			<Box className="filter">
				<TextField
					defaultValue={date(dateInc(-14), '-')}
					inputRef={refStart}
					inputProps={{
						min: '2020-12-01',
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
						min: '2020-12-01',
						max: sToday
					}}
					label="End"
					size="small"
					type="date"
					variant="outlined"
					InputLabelProps={{ shrink: true }}
				/>
				<Button
					color="primary"
					onClick={rangeUpdate}
					variant="contained"
				>Fetch</Button>
			</Box>
			{results &&
				<Box className="results">
					{results.length === 0 ?
						<Typography>No results</Typography>
					:
						<Results
							actions={[
								{"tooltip": "View Breakdown", "icon": ListIcon, "callback": breakdownShow}
							]}
							data={results}
							noun=""
							orderBy="lastName"
							remove={false}
							service=""
							tree={StatsParent}
							update={false}
						/>
					}
				</Box>
			}
			{dialog &&
				<Dialog
					aria-labelledby="tracking-dialog-title"
					maxWidth="lg"
					onClose={ev => dialogSet(false)}
					open={true}
				>
					<DialogTitle id="tracking-dialog-title">{dialog.name}</DialogTitle>
					<DialogContent dividers>
						{dialog.results === 0 ?
							<Typography>Loading...</Typography>
						:
							<React.Fragment>
								<Select
									native
									onChange={ev => filterSet(ev.currentTarget.value)}
									value={filter}
									variant="outlined"
								>
									<option value="all">All</option>
									<option value="signin">Signin</option>
									<option value="sms">SMS</option>
									<option value="viewed">Viewed</option>
								</Select>
								<Results
									data={filtered}
									noun=""
									orderBy="action_ts"
									remove={false}
									service=""
									tree={TrackingTree}
									update={false}
								/>
							</React.Fragment>
						}
					</DialogContent>
				</Dialog>
			}
		</Box>
	);
}

// Valid props
Stats.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.object.isRequired
}
