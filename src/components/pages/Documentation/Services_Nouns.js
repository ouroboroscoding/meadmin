/**
 * Documentation Nouns
 *
 * Page to manage nouns available in a specific service
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-02-07
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

// Format components
import { Form } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Definitions
import NounDef from 'definitions/docs/noun';
import NounExtendedDef from 'definitions/docs/noun_extended';

// Overwrite noun data and response
NounDef.data = NounExtendedDef.data;
NounDef.response = NounExtendedDef.response;

// Trees
const NounTree = new Tree(clone(NounDef));

/**
 * Noun
 *
 * Handles displaying a single noun
 *
 * @name Noun
 * @access private
 * @param Object props Attributes sent to the component
 * returns React.Component
 */
function Noun(props) {

	// State
	let [update, updateSet] = useState(false);

	// Called to remove the noun
	function remove() {

		// Tell the server to delete the record
		Rest.delete('docs', 'noun', {
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
					Events.trigger('success', props.value.title + ' noun successfully deleted');
					props.onRemoved(props.value._id);
				} else {
					Events.trigger('warning', props.value.title + ' noun failed to be deleted');
				}
			}
		})
	}

	// Called when the data is updated
	function updated(noun) {
		updateSet(false);
		props.onUpdated(noun);
	}

	// Render
	return (
		<Paper className="noun">
			<Grid container spacing={2}>
				<Grid item xs={11}>
					<Typography className="title">{props.value.title}</Typography>
					<Typography className="method mono">{props.value.method} /{props.service.name}/{props.value.uri}</Typography>
					<Typography>{props.value.description}</Typography>
				</Grid>
				<Grid item xs={1} className="actions">
					{props.rights.update &&
						<Tooltip title="Update Noun">
							<IconButton onClick={ev => updateSet(b => !b)}>
								<EditIcon />
							</IconButton>
						</Tooltip>
					}
					{props.rights.delete &&
						<Tooltip title="Delete Noun">
							<IconButton onClick={remove}>
								<DeleteIcon />
							</IconButton>
						</Tooltip>
					}
				</Grid>
				<Grid item xs={12} md={6} className="data">
					<Typography className="title">Request Data</Typography>
					<Grid container spacing={1}>
						{props.value.data.map(o =>
							<React.Fragment>
								<Grid item xs={12} md={3} className="mono">{o.field}</Grid>
								<Grid item xs={12} md={3} className="mono">{o.type}</Grid>
								<Grid item xs={12} md={6}>{o.description}</Grid>
							</React.Fragment>
						)}
					</Grid>
				</Grid>
				<Grid item xs={12} md={6} className="response">
					<Typography className="title">Response Data</Typography>
					{props.value.response.map(s =>
						<Typography className="mono">{s}</Typography>
					)}
				</Grid>
				<Grid item xs={12}>
					{update &&
						<Form
							cancel={ev => updateSet(b => !b)}
							errors={{
								1101: "Noun already exists"
							}}
							noun="noun"
							service="docs"
							success={updated}
							title="Update"
							tree={NounTree}
							type="update"
							value={props.value}
						/>
					}
				</Grid>
			</Grid>
		</Paper>
	);
}

// Valid props
Noun.propTypes = {
	onRemoved: PropTypes.func.isRequired,
	onUpdated: PropTypes.func.isRequired,
	rights: PropTypes.object.isRequired,
	service: PropTypes.object.isRequired,
	value: PropTypes.object.isRequired
}

/**
 * Nouns
 *
 * Displays all nouns from a specific service
 *
 * @name Nouns
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Nouns(props) {

	// State
	let [create, createSet] = useState(false);
	let [nouns, nounsSet] = useState(null);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			nounsFetch();
		} else {
			nounsSet(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Called before the noun is created to add the service ID
	function nounBeforeSubmit(record, type) {
		if(type === 'create') {
			record.service = props.service._id;
		}
		return record;
	}

	// Called after a service is created
	function nounCreated(noun) {

		// Clone the current nouns
		let lNouns = clone(nouns);

		// Push the noun to the start of the list
		lNouns.unshift(noun);

		// Set the new state
		nounsSet(lNouns);
		createSet(false);
	}

	// Called after a noun is removed
	function nounRemoved(_id) {

		// Try to find the index using the ID
		let iIndex = afindi(nouns, '_id', _id);

		// If the index exists
		if(iIndex > -1) {

			// Clone the current nouns
			let lNouns = clone(nouns);

			// Remove the index from the list
			lNouns.splice(iIndex, 1);

			// Set the new state
			nounsSet(lNouns);
		}
	}

	// Fetch all nouns
	function nounsFetch() {

		// Make the request to the server
		Rest.read('docs', 'service', {
			_id: props.service._id,
			nouns: true
		}, {session: false}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				nounsSet(res.data.nouns);
			}
		});
	}

	// Called when a noun is updated
	function nounUpdated(noun) {

		// Try to find the index using the ID
		let iIndex = afindi(nouns, '_id', noun._id);

		// If the index exists
		if(iIndex > -1) {

			// Clone the current nouns
			let lNouns = clone(nouns);

			// Update the index
			lNouns[iIndex] = {...lNouns[iIndex], ...noun};

			// Set the new state
			nounsSet(lNouns);
		}
	}

	// If we haven't finished loading
	if(nouns === null) {
		return <Box className="nouns"><Typography>Loading...</Typography></Box>
	}

	// Render
	return (
		<Box className="nouns">
			<Box className="header">
				<Typography className="title">{props.service.title} Nouns</Typography>
				{props.rights.create &&
					<Tooltip title="Add Noun">
						<IconButton onClick={ev => createSet(b => !b)}>
							<AddCircleIcon />
						</IconButton>
					</Tooltip>
				}
			</Box>
			{create &&
				<Form
					beforeSubmit={nounBeforeSubmit}
					cancel={ev => createSet(b => !b)}
					errors={{
						1101: "Noun already exists"
					}}
					noun="noun"
					service="docs"
					success={nounCreated}
					title="Add New"
					tree={NounTree}
					type="create"
					value={{
						"session": false
					}}
				/>
			}
			{nouns.length === 0 ?
				<Typography>No Services found.</Typography>
			:
				<Box>
					{nouns.map(o =>
						<Noun
							key={o._id}
							onRemoved={nounRemoved}
							onUpdated={nounUpdated}
							rights={props.rights}
							service={props.service}
							value={o}
						/>
					)}
				</Box>
			}
		</Box>
	);
}

// Valid props
Nouns.propTypes = {
	rights: PropTypes.object.isRequired,
	service: PropTypes.object.isRequired,
	user: PropTypes.object.isRequired
}
