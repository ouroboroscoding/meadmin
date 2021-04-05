/**
 * Documentation Errors
 *
 * Page to manage errors available in documentation
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-02-14
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddCircleIcon from '@material-ui/icons/AddCircle';

// Format Components
import { Form, Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone } from 'shared/generic/tools';

// Definitions
import ErrorDef from 'definitions/docs/error';

// Trees
const ErrorTree = new Tree(ErrorDef);

// Default set of rights when no user
const _NO_RIGHTS = {
	create: false,
	delete: false,
	update: false
}

/**
 * Errors
 *
 * Handles displaying errors that can be returned from services
 *
 * @name Errors
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Errors(props) {

	// State
	let [create, createSet] = useState(false);
	let [errors, errorsSet] = useState(null);
	let [rights, rightsSet] = useState(_NO_RIGHTS);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			errorsFetch();
			rightsSet({
				create: Rights.has('documentation', 'create'),
				delete: Rights.has('documentation', 'delete'),
				update: Rights.has('documentation', 'update')
			})
		} else {
			errorsSet(null);
			rightsSet(_NO_RIGHTS);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Called after a error is created
	function errorCreated(error) {

		// Clone the current errors
		let lErrors = clone(errors);

		// Push the error to the start of the list
		lErrors.unshift(error);

		// Set the new state
		errorsSet(lErrors);
		createSet(false);
	}

	// Called after a error is removed
	function errorRemoved(_id) {

		// Try to find the index using the ID
		let iIndex = afindi(errors, '_id', _id);

		// If the index exists
		if(iIndex > -1) {

			// Clone the current errors
			let lErrors = clone(errors);

			// Remove the index from the list
			lErrors.splice(iIndex, 1);

			// Set the new state
			errorsSet(lErrors);
		}
	}

	// Fetch all errors
	function errorsFetch() {

		// Make the request to the server
		Rest.read('docs', 'errors', {}, {session: false}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				errorsSet(res.data);
			}
		});
	}

	// Called when a error is updated
	function errorUpdated(error) {

		// Try to find the index using the ID
		let iIndex = afindi(errors, '_id', error._id);

		// If the index exists
		if(iIndex > -1) {

			// Clone the current errors
			let lErrors = clone(errors);

			// Update the index
			lErrors[iIndex] = error;

			// Set the new state
			errorsSet(lErrors);
		}
	}

	// If we haven't finished loading
	if(errors === null) {
		return <Box id="docsErrors"><Typography>Loading...</Typography></Box>
	}

	// Render
	return (
		<Box id="docsErrors">
			<Box className="page_header">
				<Typography className="title">Documentaton Errors</Typography>
				{rights.create &&
					<Tooltip title="Add Error">
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
						1101: "Error already exists"
					}}
					noun="error"
					service="docs"
					success={errorCreated}
					title="Add New"
					tree={ErrorTree}
					type="create"
				/>
			}
			{errors.length === 0 ?
				<Typography>No Errors found.</Typography>
			:
				<Results
					data={errors}
					errors={{
						1101: "Error already exists"
					}}
					noun="error"
					orderBy="code"
					remove={rights.delete ? errorRemoved : false}
					service="docs"
					tree={ErrorTree}
					update={rights.update ? errorUpdated : false}
				/>
			}
		</Box>
	);
}

// Valid props
Errors.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
