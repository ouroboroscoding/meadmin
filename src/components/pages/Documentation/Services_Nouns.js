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
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Definitions
import NounDef from 'definitions/docs/noun';
import NounDataDef from 'definitions/docs/noun_data';
import NounResponseDef from 'definitions/docs/noun_response';

// Overwrite noun data and response
NounDef.data = NounDataDef;
NounDef.response = NounResponseDef;

// Trees
const NounTree = new Tree(clone(NounDef));


function Noun(props) {
	return <pre>{JSON.stringify(props.value)}</pre>
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
				Events.trigger('error', JSON.stringify(res.error));
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
			lNouns[iIndex] = noun;

			// Set the new state
			nounsSet(lNouns);
		}
	}

	// If we haven't finished loading
	if(nouns === null) {
		return <Box className="docsNouns"><Typography>Loading...</Typography></Box>
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
