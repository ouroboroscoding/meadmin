/**
 * Provider Hours
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

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import ListIcon from '@material-ui/icons/List';

// Format Components
import ResultsComponent from 'shared/components/format/Results';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { date, dateInc } from 'shared/generic/tools';

// Generate the tree for the results component
const HoursParent = new Parent({
	__react__: {
		primary: 'memoId',
		results: ['firstName', 'lastName', 'hours', 'approvals', 'declines']
	},
	memoId: {__type__: 'uint'},
	firstName: {__type__: 'string', __react__: {title: 'First'}},
	lastName: {__type__: 'string', __react__: {title: 'Last'}},
	hours: {__type__: 'string', __react__: {title: 'Total Hours'}},
	approvals: {__type__: 'uint'},
	declines: {__type__: 'uint'}
})

/**
 * Hours
 *
 * Returns breakdown of provider worked hours
 *
 * @name Hours
 * @extends React.Component
 */
export default function Hours(props) {

	// State
	let [range, rangeSet] = useState(null);
	let [results, resultsSet] = useState(false)

	// Refs
	let refStart = useRef();
	let refEnd = useRef();

	// Filter change
	useEffect(() => {
		if(range) {
			resultsFetch()
		} else {
			resultsSet(false);
		}
	// eslint-disable-next-line
	}, [range]);

	// Show individual provider breakdown
	function breakdownShow(provider) {
		console.log(provider);
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
		<Box id="providerHours">
			<Box className="page_header">
				<Typography className="title">Provider Hours</Typography>
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
						<ResultsComponent
							actions={[
								{"tooltip": "View Breakdown", "icon": ListIcon, "callback": breakdownShow}
							]}
							data={results}
							noun=""
							orderBy="lastName"
							remove={false}
							service=""
							tree={HoursParent}
							update={false}
						/>
					}
				</Box>
			}
		</Box>
	);
}

// Valid props
Hours.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.object.isRequired
}
