/**
 * Graph
 *
 * Page to view graphs of ticket open/resolved by agent group or agent
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-06-11
 */

// NPM modules
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { date, dateInc, safeLocalStorage } from 'shared/generic/tools';

// Constants
const CHART_COLOURS = {
	opened: 'rgb(255, 0, 0, 0.9)',
	resolved: 'rgb(0, 255, 0, 0.9)'
}

/**
 * Graph
 *
 * Graphs out ticket stat counts
 *
 * @name Graph
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Graph(props) {

	// State
	let [agents, agentsSet] = useState(false);
	let [stats, statsSet] = useState(false);

	// Refs
	let refStart = useRef();
	let refEnd = useRef();
	let refAction = useRef();
	let refAgent = useRef();
	let refRange = useRef();

	// Load effect
	useEffect(() => {
		Rest.read('csr', 'agent/names').done(res => {
			agentsSet(res.data);
		});
	}, []);

	// Called to fetch the stats from the server
	function statsFetch() {

		// Init the data for the request
		let oData = {
			range_type: refRange.current.value,
			range: [
				refStart.current.value,
				refEnd.current.value
			]
		}

		// If it's an individual agent
		if(refAgent.current.value.substr(0,3) === 'id_') {
			oData.memo_id = parseInt(refAgent.current.value.substr(3), 10);
		}

		// Else if it's a type of agents
		else if(refAgent.current.value.substr(0,5) === 'type_') {
			oData.agent_type = refAgent.current.value.substr(5);
		}

		// If we have an action type
		if(refAction.current.value !== '0') {
			oData.action = refAction.current.value;
		}

		// Make the REST request
		Rest.read('csr', 'ticket/stats/graph', oData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we have data, set the stats
			if(res.data) {
				statsProcess(res.data);
			}
		});
	}

	// Process the incoming data so it fits the Chart
	function statsProcess(data) {

		// Pull off the dates
		let lDates = data.dates;
		delete data.dates;

		// Init the datasets
		let lDataSets = []

		// Go through the remaining data and create individual datasets
		for(let k in data) {
			lDataSets.push({
				label: k,
				data: lDates.map(s => data[k][s]),
				fill: false,
				borderColor: CHART_COLOURS[k],
				lineTensions: 0.1,
				beginAtZero: true
			});
		}

		// Set the stats
		statsSet({
			labels: lDates,
			datasets: lDataSets
		});
	}

	// Generate today date
	let sToday = date(new Date(), '-');

	// Render
	return (
		<Box id="agentGraphs" className="page" style={{marginTop: '20px'}}>
			<Box className="filter">
				<TextField
					defaultValue={date(dateInc(-14), '-')}
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
					<InputLabel htmlFor="filter-range" style={{backgroundColor: 'white', padding: '0 5px'}}>Range</InputLabel>
					<Select
						defaultValue={safeLocalStorage('agent_graph_range', 'day')}
						inputProps={{id: 'filter-range'}}
						native
						onChange={ev => localStorage.setItem('agent_graph_range', ev.target.value)}
						inputRef={refRange}
					>
						<option value="day">Day</option>
						<option value="week">Week</option>
						<option value="month">Month</option>
					</Select>
				</FormControl>&nbsp;
				<FormControl size="small" variant="outlined">
					<InputLabel htmlFor="filter-action" style={{backgroundColor: 'white', padding: '0 5px'}}>Action</InputLabel>
					<Select
						defaultValue={safeLocalStorage('agent_graph_action', '0')}
						inputProps={{id: 'filter-action'}}
						native
						onChange={ev => localStorage.setItem('agent_graph_action', ev.target.value)}
						inputRef={refAction}
					>
						<option value="0">Both</option>
						<option value="opened">Opened</option>
						<option value="resolved">Resolved</option>
					</Select>
				</FormControl>&nbsp;
				{agents &&
					<FormControl size="small" variant="outlined">
						<InputLabel htmlFor="filter-agent" style={{backgroundColor: 'white', padding: '0 5px'}}>Agent</InputLabel>
						<Select
							defaultValue={safeLocalStorage('agent_graph_agent', 'type_agent')}
							inputProps={{id: 'filter-agent'}}
							native
							onChange={ev => localStorage.setItem('agent_graph_agent', ev.target.value)}
							inputRef={refAgent}
						>
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
				}
				<Button
					color="primary"
					onClick={statsFetch}
					variant="contained"
				>Fetch</Button>
			</Box>
			{stats !== false &&
				<Box style={{marginTop: '10px'}}>
					{stats.length === 0 ?
						<Typography>No stats found</Typography>
					:
						<Line
							beginAtZero={true}
							data={stats}
							options={{scales:{yAxes:{ticks:{beginAtZero:true,callback:value => { if(Number.isInteger(value)) return value; }}}}}}
						/>
					}
				</Box>
			}
		</Box>
	);
}

// Prop Types
Graph.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
