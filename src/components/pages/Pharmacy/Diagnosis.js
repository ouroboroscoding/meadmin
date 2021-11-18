/**
 * Pharmacy Diagnosis
 *
 * Page to manage diagnoses from IDC to DoseSpot ID
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-09-16
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
import { afindi, clone } from 'shared/generic/tools';

// Agent Definition
import DiagnosisDef from 'definitions/prescriptions/diagnosis';

// Generate the diagnosis Tree
const DiagnosisTree = new Tree(DiagnosisDef);

// Default set of rights when no user
const _NO_RIGHTS = {
	create: false,
	delete: false,
	update: false
}

/**
 * Diagnosis
 *
 * Lists all diagnoses available to the signed in user
 *
 * @name Diagnosis
 * @access public
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function Diagnosis(props) {

	// State
	let [create, createSet] = useState(false);
	let [diagnoses, diagnosesSet] = useState(null);
	let [rights, rightsSet] = useState(_NO_RIGHTS);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			diagnosesFetch();
			rightsSet({
				create: Rights.has('rx_diagnosis', 'create'),
				delete: Rights.has('rx_diagnosis', 'delete'),
				update: Rights.has('rx_diagnosis', 'update')
			})
		} else {
			diagnosesSet(null);
			rightsSet(_NO_RIGHTS);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Add the created diagnosis to the list
	function diagnosisCreated(diagnosis) {

		// Hide the create form
		createSet(false);

		// Use the current diagnoses to set the new diagnoses
		diagnosesSet(diagnoses => {

			// Clone the diagnoses
			let ret = clone(diagnoses);

			// Add the diagnosis to the front of the list
			ret.unshift(diagnosis);

			// Return the new diagnoses
			return ret;
		})
	}

	// Remove a diagnosis
	function diagnosisRemove(_id) {

		// Use the current diagnoses to set the new diagnoses
		diagnosesSet(diagnoses => {

			// Clone the diagnoses
			let ret = clone(diagnoses);

			// Find the index
			let iIndex = afindi(ret, '_id', _id);

			// If one is found, remove it
			if(iIndex > -1) {
				ret.splice(iIndex, 1);
			}

			// Return the new diagnoses
			return ret;
		});
	}

	// Fetch all the diagnoses from the server
	function diagnosesFetch() {

		// Fetch all diagnoses
		Rest.read('prescriptions', 'diagnoses', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the diagnoses
				diagnosesSet(res.data);
			}
		});
	}

	// Update a diagnosis
	function diagnosisUpdate(diagnosis) {

		// Use the current diagnoses to set the new diagnoses
		diagnosesSet(diagnoses => {

			// Clone the diagnoses
			let ret = clone(diagnoses);

			// Find the index
			let iIndex = afindi(ret, '_id', diagnosis._id);

			// If one is found, update it
			if(iIndex > -1) {
				ret[iIndex] = diagnosis;
			}

			// Return the new diagnoses
			return ret;
		});
	}

	// Return the rendered component
	return (
		<Box id="pharmacyDiagnosis" className="page flexGrow">
			<Box className="page_header">
				<Typography className="title">IDC to DoseSpot</Typography>
				{rights.create &&
					<Tooltip title="Create new Diagnosis">
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
						noun="diagnosis"
						service="prescriptions"
						success={diagnosisCreated}
						tree={DiagnosisTree}
						type="create"
					/>
				</Paper>
			}
			{diagnoses === null ?
				<Box>Loading...</Box>
			:
				<Results
					data={diagnoses}
					noun="diagnosis"
					orderBy="key"
					remove={rights.delete ? diagnosisRemove : false}
					service="prescriptions"
					tree={DiagnosisTree}
					update={rights.update ? diagnosisUpdate : false}
				/>
			}
		</Box>
	);
}

// Valid props
Diagnosis.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
