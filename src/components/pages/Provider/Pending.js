/**
 * Pending Orders
 *
 * Displays order stats for pending orders
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-04-05
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';

// Format Components
import { Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { safeLocalStorage } from 'shared/generic/tools';

// Pending tree
const PendingTree = new Tree({
	"__name__": "PendingOrders",
	"full_name": {"__type__":"string", "__react__":{"title":"State"}},
	"legalEncounterType": {"__type__":"string", "__react__":{"title":"Encounter Type"}},
	"new": {"__type__":"uint", "__react__":{"title":"New"}},
	"expiring": {"__type__":"uint", "__react__":{"title":"Expiring"}},
	"total": {"__type__":"uint"}
});

/**
 * Pending
 *
 * Returns breakdown of provider worked hours
 *
 * @name Stats
 * @extends React.Component
 */
export default function Pending(props) {

	// State
	let [filter, filterSet] = useState(safeLocalStorage('providerStatsFilter', {encounter: null}));
	let [filtered, filteredSet] = useState(false);
	let [results, resultsSet] = useState(false)

	// Load effect
	useEffect(() => {
		if(props.user) {
			resultsFetch();
		} else {
			resultsSet(false);
		}
	// eslint-disable-next-line
	}, [props.user]);

	// Filter effect
	useEffect(() => {
		resultsFilter();
	// eslint-disable-next-line
	}, [results, filter]);

	// Get the hours by provider for the given start/end
	function resultsFetch() {

		// Fetch the results from the server
		Rest.read('monolith', 'orders/pending/counts').done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
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

	// Filter the results
	function resultsFilter() {

		// If encounter type is null, we show everything
		if(filter.encounter === null) {
			filteredSet(results);
			return;
		}

		// Create a new list
		let lResults = [];

		// Go through each current result
		for(let i = 0; i < results.length; ++i) {

			// If it matches the encounter type
			if(results[i].legalEncounterType === filter.encounter) {
				lResults.push(results[i]);
			}
		}

		// Set the new filtered list
		filteredSet(lResults)
	}

	// Render
	return (
		<Box id="providerPending" className="page flexGrow">
			<Box className="page_header">
				<Typography className="title">Pending Orders by State</Typography>
				<FormControl>
					<InputLabel htmlFor="encounter-filter">Encounter Type</InputLabel>
					<Select
						inputProps={{
							id: 'encounter-filter'
						}}
						native
						onChange={ev => filterSet({encounter: ev.target.value === 'all' ? null : ev.target.value})}
						value={filter.encounter === null ? 'all' : filter.encounter}
					>
						<option value="all">All</option>
						<option value="AS">Asynchronous</option>
						<option value="A">Audio</option>
						<option value="V">Video</option>
					</Select>
				</FormControl>
			</Box>
			{filtered === false ?
				<Typography>Loading...</Typography>
			:
				<Results
					data={filtered}
					noun=""
					orderBy="full_name"
					remove={false}
					service=""
					totals={true}
					tree={PendingTree}
					update={false}
				/>
			}
		</Box>
	)
}

// Valid props
Pending.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.object.isRequired
}
