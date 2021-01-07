/**
 * Calendly Events
 *
 * Page to manage calendly events (rooms)
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-01-06
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';

// Format Components
import FormComponent from 'shared/components/format/Form';
import ResultsComponent from 'shared/components/format/Results';
import { SelectData } from 'shared/components/format/Shared';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, omap } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

// Agent Definition
import CalendlyEventDef from 'definitions/monolith/calendly_event';

// Data
import Divisions from 'definitions/divisions';

// Map the states
const _states = omap(Divisions['US'], (v,k) => [k,v]);

// Set the custom data
CalendlyEventDef['state']['__react__']['options'] = _states
CalendlyEventDef['provider']['__react__']['options'] = new SelectData('monolith', 'providers', 'id', 'name');

// Generate the agent Tree
const CalendlyEventTree = new Tree(CalendlyEventDef);

// Default set of rights when no user
const _NO_RIGHTS = {
	create: false,
	delete: false,
	update: false
}

/**
 * Calendly Events
 *
 * Lists all calendly events available
 *
 * @name CalendlyEvents
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function CalendlyEvents(props) {

	// State
	let [create, createSet] = useState(false);
	let [events, eventsSet] = useState(null);
	let [rights, rightsSet] = useState(_NO_RIGHTS);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			eventsFetch();
			rightsSet({
				create: Utils.hasRight(props.user, 'calendly_admin', 'create'),
				delete: Utils.hasRight(props.user, 'calendly_admin', 'delete'),
				update: Utils.hasRight(props.user, 'calendly_admin', 'update')
			})
		} else {
			eventsSet(null);
			rightsSet(_NO_RIGHTS);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Add the created event to the list
	function eventCreated(event) {

		// Hide the create form
		createSet(false);

		// Use the current events to set the new events
		eventsSet(events => {

			// Clone the events
			let ret = clone(events);

			// Add the event to the front of the list
			ret.unshift(event);

			// Return the new events
			return ret;
		})
	}

	// Remove a event
	function eventRemove(id) {

		// Use the current events to set the new events
		eventsSet(events => {

			// Clone the events
			let ret = clone(events);

			// Find the index
			let iIndex = afindi(ret, 'id', id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new events
			return ret;
		});
	}

	// Fetch all the events from the server
	function eventsFetch() {

		// Fetch all events
		Rest.read('monolith', 'calendly/events', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the events
				eventsSet(res.data);
			}
		});
	}

	// Update a event
	function eventUpdate(event) {

		// Use the current events to set the new events
		eventsSet(events => {

			// Clone the events
			let ret = clone(events);

			// Find the index
			let iIndex = afindi(ret, 'id', event.id);

			// If one is found, update it
			if(iIndex > -1) {
				ret[iIndex] = event;
			}

			// Return the new events
			return ret;
		});
	}

	// Return the rendered component
	return (
		<Box id="pharmacyCalendlyEvents" className="page">
			<Box className="page_header">
				<Typography className="title">Calendly Events</Typography>
				{rights.create &&
					<Tooltip title="Create new Event">
						<IconButton onClick={ev => createSet(b => !b)}>
							<AddCircleIcon className="icon" />
						</IconButton>
					</Tooltip>
				}
			</Box>
			{create &&
				<Paper className="padded">
					<FormComponent
						cancel={ev => createSet(false)}
						noun="calendly/event"
						service="monolith"
						success={eventCreated}
						tree={CalendlyEventTree}
						type="create"
					/>
				</Paper>
			}
			{events === null ?
				<Box>Loading...</Box>
			:
				<ResultsComponent
					data={events}
					noun="calendly/event"
					orderBy="key"
					remove={rights.delete ? eventRemove : false}
					service="monolith"
					tree={CalendlyEventTree}
					update={rights.update ? eventUpdate : false}
				/>
			}
		</Box>
	);
}

// Valid props
CalendlyEvents.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
