/**
 * Hours
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
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone, omap } from 'shared/generic/tools';

// Constants
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const NICE_DAYS = {
	sun: 'Sunday',
	mon: 'Monday',
	tue: 'Tuesday',
	wed: 'Wednesday',
	thu: 'Thursday',
	fri: 'Friday',
	sat: 'Saturday'
}

/**
 * Time
 *
 * Handles a single time (hours, minutes)
 *
 * @name Time
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function Time(props) {

	// State
	let [state, stateSet] = useState({
		hour: 0,
		minutes: 0,
		period: 'AM'
	});

	// Effect when the value is changed
	useEffect(() => {

		// Split into 3 parts and convert to ints
		let lTime = props.value.split(':')

		// Init the new state
		let oState = {
			hour: parseInt(lTime[0], 10),
			minutes: lTime[1],
			period: 'AM'
		}

		// If the hour is more than 12
		if(lTime[0] > 12) {
			oState.hour -= 12;
			oState.period = 'PM';
		}

		// Set the state
		stateSet(oState);

	}, [props.value]);

	// Calculates and returns the actual ISO time
	function calculate(state) {

		// Init the parts
		let lTime = ['', state.minutes, '00']

		// If we're in PM
		if(state.period === 'PM') {
			lTime[0] = (state.hour + 12).toString();
		}

		// Else, if the time is less then 10
		else if(state.hour < 10) {
			lTime[0] = '0' + state.hour;
		}

		// Else, store as is
		else {
			lTime[0] = state.hour.toString()
		}

		// Join and return
		return lTime.join(':');
	}

	// Called when the hour changes
	function hour(ev) {

		// Change the state
		stateSet(state => {

			// Change the hour
			state.hour = parseInt(ev.target.value);

			// Calculate the iso and send it to the parent
			props.onChange(calculate(state));

			// Clone and return
			return clone(state);
		});
	}

	// Called when the minute changes
	function minutes(ev) {

		// Change the state
		stateSet(state => {

			// Change the minutes
			state.minutes = ev.target.value;

			// Calculate the iso and send it to the parent
			props.onChange(calculate(state));

			// Clone and return
			return clone(state);
		});
	}

	// Called when the period changes
	function period(ev) {

		// Change the state
		stateSet(state => {

			// Change the pm
			state.period = ev.target.value;

			// Calculate the iso and send it to the parent
			props.onChange(calculate(state));

			// Clone and return
			return clone(state);
		});
	}

	// Render
	return (
		<React.Fragment>
			<Select
				native
				onChange={hour}
				value={state.hour.toString()}
			>
				<option>12</option>
				<option>1</option>
				<option>2</option>
				<option>3</option>
				<option>4</option>
				<option>5</option>
				<option>6</option>
				<option>7</option>
				<option>8</option>
				<option>9</option>
				<option>10</option>
				<option>11</option>
			</Select> : <Select
				native
				onChange={minutes}
				value={(state.minutes < 10 ? '0' : '') + state.minutes.toString()}
			>
				<option>00</option>
				<option>05</option>
				<option>10</option>
				<option>15</option>
				<option>20</option>
				<option>25</option>
				<option>30</option>
				<option>35</option>
				<option>40</option>
				<option>45</option>
				<option>50</option>
				<option>55</option>
			</Select> <Select
				native
				onChange={period}
				value={state.period}
			>
				<option>AM</option>
				<option>PM</option>
			</Select>
		</React.Fragment>
	);
}

// Force props
Time.propTypes = {
	onChange: PropTypes.func.isRequired,
	value: PropTypes.string.isRequired
}

/**
 * Day
 *
 * Handles a single day of hours
 *
 * @name Day
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function Day(props) {

	// Called to update the on/off
	function onOffUpdate(ev) {

		// If it's on
		if(ev.target.checked) {
			props.onChange(props.dow, {
				start: '09:00:00',
				end: '17:00:00'
			});
		} else {
			props.onChange(props.dow, null);
		}
	}

	// Called to update the start
	function startUpdate(time) {

		// Clone the existing value
		let oValue = clone(props.value);

		// Set the new start
		oValue.start = time;

		// If the new value is further than the end
		if(oValue.start > oValue.end) {
			oValue.end = oValue.start;
		}

		// Let the parent know
		props.onChange(props.dow, oValue);
	}

	// Called to update the end
	function endUpdate(time) {

		// Clone the existing value
		let oValue = clone(props.value);

		// Set the new end
		oValue.end = time;

		// If the new value is before the start
		if(oValue.end < oValue.start) {
			oValue.start = oValue.end;
		}

		// Let the parent know
		props.onChange(props.dow, oValue);
	}

	console.log(props);

	// Render
	return (
		<Box className="agentAccountsHoursDay flexColumns">
			<Typography className="name flexStatic">{NICE_DAYS[props.dow]}</Typography>
			<Box className="flexStatic">
				<Switch
					checked={props.value ? true : false}
					color="primary"
					onChange={onOffUpdate}
				/>
			</Box>
			<Box className="flexGrow">
				{props.value &&
					<React.Fragment>
						<Time
							onChange={startUpdate}
							value={props.value.start}
						/>
						&nbsp;&nbsp;&nbsp;to&nbsp;&nbsp;&nbsp;
						<Time
							onChange={endUpdate}
							value={props.value.end}
						/>
					</React.Fragment>
				}
			</Box>
		</Box>
	);
}

// Force props
Day.propTypes = {
	dow: PropTypes.oneOf(DAYS),
	onChange: PropTypes.func.isRequired,
	value: PropTypes.shape({
		start: PropTypes.string.isRequired,
		end: PropTypes.string.isRequired
	})
}

/**
 * Hours
 *
 * Handles the form to set hours per day of the week
 *
 * @name Hours
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Hours(props) {

	// State
	let [days, daysSet] = useState({});

	// Load effect
	useEffect(() => {

		// Fetch the data from the server
		Rest.read('csr', 'agent/hours', {
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

				// Set the hours by day
				let oDays = {}
				for(let o of res.data) {
					oDays[o.dow] = {start: o.start, end: o.end};
				}

				// Update the state
				daysSet(oDays);
			}
		});
	}, [props.value.memo_id]);

	// Called when a day's hours change
	function dayChange(dow, hours) {

		// Make sure to get the latest
		daysSet(days => {

			// If we got hours, add/update them
			if(hours) {
				days[dow] = hours;
			}

			// Else, delete the record
			else {
				delete days[dow];
			}

			// Clone and return the data
			return clone(days);
		});
	}

	// Called to update the hours for the agent
	function update() {

		// Send the data to the server
		Rest.update('csr', 'agent/hours', {
			memo_id: props.value.memo_id,
			hours: omap(days, (o,k) => ({
				dow: k,
				start: o.start,
				end: o.end
			}))
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
				Events.trigger('success', 'Hours saved');
				props.onClose();
			}
		});
	}

	// Render
	return (
		<Box className="agentAccountsHours">
			{DAYS.map(s =>
				<Day
					dow={s}
					key={s}
					onChange={dayChange}
					value={s in days ? days[s] : null}
				/>
			)}
			<Box className="actions">
				<Button variant="contained" color="secondary" onClick={props.onClose}>Cancel</Button>
				<Button variant="contained" color="primary" onClick={update}>Update</Button>
			</Box>
		</Box>
	);
}

// Force props
Hours.propTypes = {
	onClose: PropTypes.func.isRequired,
	value: PropTypes.object.isRequired
}
