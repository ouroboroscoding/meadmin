/**
 * QueueNumbers
 *
 * Page to manage justcall queue numbers
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-07-22
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
import { Form, Results } from 'shared/components/Format';

// Shared communication modules
import Rest from 'shared/communication/rest';
import Rights from 'shared/communication/rights';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, nicePhone } from 'shared/generic/tools';

// QueueNumber Definition
import QueueNumberDef from 'definitions/justcall/queue_number';

// Generate the QueueNumber Tree
const QueueNumberTree = new Tree(QueueNumberDef);

// Default set of rights when no user
const _NO_RIGHTS = {
	create: false,
	delete: false
}

/**
 * QueueNumbers
 *
 * Lists all numbers available
 *
 * @name QueueNumbers
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function QueueNumbers(props) {

	// State
	let [create, createSet] = useState(false);
	let [numbers, numbersSet] = useState(null);
	let [rights, rightsSet] = useState(_NO_RIGHTS);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			numbersFetch();
			rightsSet({
				create: Rights.has('justcall', 'create'),
				delete: Rights.has('justcall', 'delete')
			})
		} else {
			numbersSet(null);
			rightsSet(_NO_RIGHTS);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Add the created number to the list
	function numberCreated(number) {

		// Hide the create form
		createSet(false);

		// Use the current numbers to set the new numbers
		numbersSet(numbers => {

			// Clone the numbers
			let ret = clone(numbers);

			// Add the number to the front of the list
			ret.unshift(number);

			// Return the new numbers
			return ret;
		});
	}

	// Remove the deleted number from the list
	function numberDelete(number) {

		// Use the current numbers to set the new numbers
		numbersSet(numbers => {

			// Find the index
			let iIndex = afindi(numbers, 'justcall_number', number);

			// If one is found, delete it and return a cloned list
			if(iIndex > -1) {
				numbers.splice(iIndex, 1);
				return clone(numbers);
			}

			// Return the existing numbers
			return numbers;
		});
	}

	// Fetch all the numbers from the server
	function numbersFetch() {

		// Fetch all numbers
		Rest.read('justcall', 'queue/number', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the numbers
				numbersSet(res.data);
			}
		});
	}

	// Return the rendered component
	return (
		<Box id="justcallQueueNumbers" className="page flexGrow">
			<Box className="page_header">
				<Typography className="title">JustCall Queue Numbers</Typography>
				{rights.create &&
					<Tooltip title="Add JustCall Number">
						<IconButton onClick={ev => createSet(b => !b)}>
							<AddCircleIcon className="icon" />
						</IconButton>
					</Tooltip>
				}
			</Box>
			{create &&
				<Paper className="padded">
					<Form
						cancel={ev => createSet(false)}
						noun="queue/number"
						service="justcall"
						success={numberCreated}
						tree={QueueNumberTree}
						type="create"
					/>
				</Paper>
			}
			{numbers === null ?
				<Box>Loading...</Box>
			:
				<Results
					custom={{
						justcall_number: row => nicePhone(row.justcall_number)
					}}
					data={numbers}
					noun="queue/number"
					orderBy="justcall_number"
					remove={rights.delete ? numberDelete : false}
					service="justcall"
					tree={QueueNumberTree}
					update={false}
				/>
			}
		</Box>
	);
}

// Valid props
QueueNumbers.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
