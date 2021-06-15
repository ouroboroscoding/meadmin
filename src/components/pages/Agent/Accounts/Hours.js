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
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

// Constants
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const HOURS = [
	['12:00 AM EST', '00:00:00'], [' 1:00 AM EST', '01:00:00'], [' 2:00 AM EST', '02:00:00'],
	[' 3:00 AM EST', '03:00:00'], [' 4:00 AM EST', '04:00:00'], [' 5:00 AM EST', '05:00:00'],
	[' 6:00 AM EST', '06:00:00'], [' 7:00 AM EST', '07:00:00'], [' 8:00 AM EST', '08:00:00'],
	[' 9:00 AM EST', '09:00:00'], ['10:00 AM EST', '10:00:00'], ['11:00 AM EST', '11:00:00'],
	['12:00 PM EST', '12:00:00'], [' 1:00 PM EST', '13:00:00'], [' 2:00 PM EST', '14:00:00'],
	[' 3:00 PM EST', '15:00:00'], [' 4:00 PM EST', '16:00:00'], [' 5:00 PM EST', '17:00:00'],
	[' 6:00 PM EST', '18:00:00'], [' 7:00 PM EST', '19:00:00'], [' 8:00 PM EST', '20:00:00'],
	[' 9:00 PM EST', '21:00:00'], ['10:00 PM EST', '22:00:00'], ['11:00 PM EST', '23:00:00']
];
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
	function startUpdate(ev) {

		// Clone the existing value
		let oValue = clone(props.value);

		// Set the new start
		oValue.start = ev.target.value;

		// If the new value is further than the end
		if(oValue.start > oValue.end) {
			oValue.end = oValue.start;
		}

		// Let the parent know
		props.onChange(props.dow, oValue);
	}

	// Called to update the end
	function endUpdate(ev) {

		// Clone the existing value
		let oValue = clone(props.value);

		// Set the new end
		oValue.end = ev.target.value;

		// If the new value is before the start
		if(oValue.end < oValue.start) {
			oValue.start = oValue.end;
		}

		// Let the parent know
		props.onChange(props.dow, oValue);
	}

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
						<FormControl size="small" variant="outlined">
							<InputLabel htmlFor={'hoursStart-' + props.dow} style={{backgroundColor: 'white', padding: '0 5px'}}>Start</InputLabel>
							<Select
								inputProps={{id: 'hoursStart-' + props.dow}}
								native
								onChange={startUpdate}
								value={props.value.start}
							>
								{HOURS.map(l =>
									<option key={l[1]} value={l[1]}>{l[0]}</option>
								)}
							</Select>
						</FormControl>
						&nbsp;
						<FormControl size="small" variant="outlined">
							<InputLabel htmlFor={'hoursEnd-' + props.dow} style={{backgroundColor: 'white', padding: '0 5px'}}>End</InputLabel>
							<Select
								inputProps={{id: 'hoursEnd-' + props.dow}}
								native
								onChange={endUpdate}
								value={props.value.end}
							>
								{HOURS.map(l =>
									<option key={l[1]} value={l[1]}>{l[0]}</option>
								)}
							</Select>
						</FormControl>
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
			memo_id: props.memo_id
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
	}, [props.memo_id]);

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
		</Box>
	);
}

// Force props
Hours.propTypes = {
	onClose: PropTypes.func.isRequired,
	value: PropTypes.object.isRequired
}
