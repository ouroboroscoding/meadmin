/**
 * Documentation Services
 *
 * Page to manage services available in documentation
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-02-06
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ViewListIcon from '@material-ui/icons/ViewList';

// Local components
import Nouns from './Services_Nouns';

// Format Components
import { Form } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Definitions
import ServiceDef from 'definitions/docs/service';

// Trees
const ServiceTree = new Tree(ServiceDef);

// Default set of rights when no user
const _NO_RIGHTS = {
	create: false,
	delete: false,
	update: false
}

/**
 * Service
 *
 * Handles displaying a single service and its nouns
 *
 * @name Service
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Service(props) {

	// State
	let [nouns, nounsSet] = useState(false);
	let [update, updateSet] = useState(false);

	// Delete the service
	function remove() {

		// Send the request to the server
		Rest.delete('docs', 'service', {
			_id: props.value._id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we  got data
			if('data' in res) {

				// If it was successfully deleted
				if(res.data) {
					Events.trigger('success', props.value.title + ' service successfully deleted');
					props.onRemoved(props.value._id);
				} else {
					Events.trigger('warning', props.value.title + ' service failed to be deleted');
				}
			}
		})
	}

	// Render
	return (
		<Paper className="service padded">
			<Grid container spacing={2}>
				<Grid item xs={11}>
					<Typography className="title">{props.value.title}</Typography>
					<Typography className="description">{props.value.description}</Typography>
				</Grid>
				<Grid item xs={1} className="actions">
					{props.rights.update &&
						<Tooltip title="Edit Service">
							<IconButton onClick={ev => updateSet(b => !b)}>
								<EditIcon />
							</IconButton>
						</Tooltip>
					}
					{props.rights.delete &&
						<Tooltip title="Delete Service">
							<IconButton onClick={remove}>
								<DeleteIcon />
							</IconButton>
						</Tooltip>
					}
					<Tooltip title="View Nouns">
						<IconButton onClick={ev => nounsSet(b => !b)}>
							<ViewListIcon />
						</IconButton>
					</Tooltip>
				</Grid>
				{update &&
					<Grid item xs={12}>
						<Form
							cancel={ev => updateSet(b => !b)}
							errors={{
								1101: "A service already exists with the new name"
							}}
							noun="service"
							service="docs"
							success={props.onUpdated}
							title={'Edit ' + props.value.title + ' Service'}
							tree={ServiceTree}
							type="update"
							value={props.value}
						/>
					</Grid>
				}
				{nouns &&
					<Grid item xs={12}>
						<Nouns
							rights={props.rights}
							service={props.value}
							user={props.user}
						/>
					</Grid>
				}
			</Grid>
		</Paper>
	)
}

// Valid props
Service.propTypes = {
	onRemoved: PropTypes.func.isRequired,
	onUpdated: PropTypes.func.isRequired,
	rights: PropTypes.object.isRequired,
	user: PropTypes.object.isRequired
}

/**
 * Services
 *
 * Lists all services available in documentation
 *
 * @name Services
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Services(props) {

	// State
	let [create, createSet] = useState(false);
	let [services, servicesSet] = useState(null);
	let [rights, rightsSet] = useState(_NO_RIGHTS);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			servicesFetch();
			rightsSet({
				create: Rights.has('documentation', 'create'),
				delete: Rights.has('documentation', 'delete'),
				update: Rights.has('documentation', 'update')
			})
		} else {
			servicesSet(null);
			rightsSet(_NO_RIGHTS);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Called after a service is created
	function serviceCreated(service) {

		// Clone the current services
		let lServices = clone(services);

		// Push the service to the start of the list
		lServices.unshift(service);

		// Set the new state
		servicesSet(lServices);
		createSet(false);
	}

	// Called after a service is removed
	function serviceRemoved(_id) {

		// Try to find the index using the ID
		let iIndex = afindi(services, '_id', _id);

		// If the index exists
		if(iIndex > -1) {

			// Clone the current services
			let lServices = clone(services);

			// Remove the index from the list
			lServices.splice(iIndex, 1);

			// Set the new state
			servicesSet(lServices);
		}
	}

	// Fetch all services
	function servicesFetch() {

		// Make the request to the server
		Rest.read('docs', 'services', {}, {session: false}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				servicesSet(res.data);
			}
		});
	}

	// Called when a service is updated
	function serviceUpdated(service) {

		// Try to find the index using the ID
		let iIndex = afindi(services, '_id', service._id);

		// If the index exists
		if(iIndex > -1) {

			// Clone the current services
			let lServices = clone(services);

			// Update the index
			lServices[iIndex] = service;

			// Set the new state
			servicesSet(lServices);
		}
	}

	// If we haven't finished loading
	if(services === null) {
		return <Box id="docsServices"><Typography>Loading...</Typography></Box>
	}

	// Render
	return (
		<Box id="docsServices">
			<Box className="page_header">
				<Typography className="title">Documentaton Services</Typography>
				{rights.create &&
					<Tooltip title="Add Service">
						<IconButton onClick={ev => createSet(b => !b)}>
							<AddCircleIcon />
						</IconButton>
					</Tooltip>
				}
			</Box>
			{create &&
				<Form
					cancel={ev => createSet(b => !b)}
					errors={{
						1101: "Service already exists"
					}}
					noun="service"
					service="docs"
					success={serviceCreated}
					title="Add New"
					tree={ServiceTree}
					type="create"
				/>
			}
			{services.length === 0 ?
				<Typography>No Services found.</Typography>
			:
				<Box>
					{services.map(o =>
						<Service
							key={o._id}
							onRemoved={serviceRemoved}
							onUpdated={serviceUpdated}
							rights={rights}
							user={props.user}
							value={o}
						/>
					)}
				</Box>
			}
		</Box>
	);
}

// Valid props
Services.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
