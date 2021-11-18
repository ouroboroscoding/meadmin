/**
 * Stats
 *
 * Primary page for displaying tabs to show which stats
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-10-19
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

// Stats components
import Raw from './Raw';
import Totals from './Totals';

/**
 * Stats
 *
 * Wrapper for the raw and graph pages
 *
 * @name Stats
 * @extends React.Component
 */
export default function Stats(props) {

	// State
	let [tab, tabSet] = useState(0);

	// When selected tab changes
	function tabChange(event, tab) {
		tabSet(tab);
	}

	// Return the rendered component
	return (
		<Box>
			<AppBar position="static" color="default">
				<Tabs
					onChange={tabChange}
					value={tab}
					variant="fullWidth"
				>
					<Tab label="Totals" />
					<Tab label="Raw" />
				</Tabs>
			</AppBar>
			<Box style={{display: tab === 0 ? 'block' : 'none'}}>
				<Totals {...props} />
			</Box>
			<Box style={{display: tab === 1 ? 'block' : 'none'}}>
				<Raw {...props} />
			</Box>
		</Box>
	);
}

// Prop Types
Stats.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
