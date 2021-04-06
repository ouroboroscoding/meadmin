/**
 * Report Recipients
 *
 * Allows setting of who receives what reports by email
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-22
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState, useEffect } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import AddBoxIcon from '@material-ui/icons/AddBox';
import DeleteIcon from '@material-ui/icons/Delete';
import PlaylistAddIcon from '@material-ui/icons/PlaylistAdd';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, compare, empty } from 'shared/generic/tools';

/**
 * Report
 *
 * A single report and its list of recipients
 *
 * @name Report
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
function Report(props) {

	// State
	let [addresses, addressesSet] = useState(props.addresses);

	// Refs
	let addressRef = useRef();
	let nameRef = useRef();

	// Effects
	useEffect(() => {
		addressesSet(props.addresses);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.addresses]); // React to user changes

	// Add a new address
	function addressAdd() {

		// Clone the existing addresses, add the new one, and set the state
		let lAddresses = clone(addresses);
		lAddresses.push(addressRef.current.value);
		addressesSet(lAddresses);

		// Clear the field
		addressRef.current.value = '';
	}

	// Remove an existing address
	function addressDel(i) {

		// Clone the existing addresses, delete the one specified, and set the
		//	state
		let lAddresses = clone(addresses);
		lAddresses.splice(i, 1);
		addressesSet(lAddresses);
	}

	// Save the changes
	function save() {

		// Let the parent know the data needs to be saved
		props.onSave(
			props._id,
			nameRef.current.value,
			clone(addresses)
		);
	}

	// Render
	return (
		<Paper className="report padded">
			<Grid container spacing={2}>
				<Grid item xs={12} sm={6}>
					<TextField
						inputRef={nameRef}
						label="Report Name"
						defaultValue={props.name}
						variant="outlined"
					/>
				</Grid>
				<Grid item xs={12} sm={6}>
					<List>
						{addresses.map((s,i) =>
							<ListItem key={s}>
								<ListItemText primary={s} />
								<ListItemSecondaryAction>
									<Tooltip title="Delete Address">
										<IconButton onClick={() => addressDel(i)}>
											<DeleteIcon />
										</IconButton>
									</Tooltip>
								</ListItemSecondaryAction>
							</ListItem>
						)}
						<ListItem>
							<ListItemText primary={
								<TextField
									inputRef={addressRef}
									label="New Address"
									defaultValue=""
									variant="outlined"
								/>
							} />
							<ListItemSecondaryAction>
								<Tooltip title="Add New Address">
									<IconButton onClick={addressAdd}>
										<AddBoxIcon />
									</IconButton>
								</Tooltip>
							</ListItemSecondaryAction>
						</ListItem>
					</List>
				</Grid>
				<Grid item xs={12} className="save">
					<Button
						color="primary"
						onClick={save}
						variant="contained"
					>
						Save
					</Button>
				</Grid>
			</Grid>
		</Paper>
	);
}

/**
 * Report Recipients
 *
 * Displays the list of report types and recipients
 *
 * @name ReportRecipients
 * @access private
 * @param Object props Attributes sent to the component
 * @returns React.Component
 */
export default function ReportRecipients(props) {

	// State
	let [createNew, createNewSet] = useState(false);
	let [reports, reportsSet] = useState([]);

	// Refs
	let nameRef = useRef();

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetch();
		} else {
			reportsSet([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Create new report
	function create() {

		// Store the new name
		let sName = nameRef.current.value;

		// Send the request to the server
		Rest.create('reports', 'recipients', {
			name: sName,
			addresses: []
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, add the new report
			if(res.data) {

				// Clone the reports, add the new one, and set the state
				let lReports = clone(reports);
				lReports.unshift({
					_id: res.data,
					name: sName,
					addresses: []
				});
				reportsSet(lReports);

				// Hide the create form
				createNewSet(false);
			}
		})
	}

	// Get all reports and their recipients
	function fetch() {

		// Send the request to the server
		Rest.read('reports', 'recipients', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data, set the reports
			if(res.data) {
				reportsSet(res.data);
			}
		});
	}

	// Save the existing record
	function update(_id, name, addresses) {

		// Find the record
		let iIndex = afindi(reports, '_id', _id);

		// If we didn't find it
		if(iIndex === -1) {
			Events.trigger('error', 'Couldn\'t find record.');
			return;
		}

		// Init the data
		let dData = {}

		// If the name changed
		if(reports[iIndex].name !== name) {
			dData['name'] = name;
		}

		// If the addresses changed
		if(!compare(reports[iIndex].addresses, addresses)) {
			dData['addresses'] = addresses;
		}

		// If nothing changed
		if(empty(dData)) {
			Events.trigger('warning', 'Nothing to save.');
			return;
		}

		// Add the ID
		dData['_id'] = _id;

		// Send the request to the server
		Rest.update('reports', 'recipients', dData).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {
				if(res.data) {
					Events.trigger('success', 'Report Recipients Saved!');
				} else {
					Events.trigger('warning', 'Nothing changed.');
				}
			}
		});
	}

	// Render
	return (
		<Box id="reports" className="page flexGrow">
			<Box className="pageHeader">
				<Typography variant="h3" className="title">Report Recipients</Typography>
				<Tooltip title="Create new list of Recipients">
					<IconButton onClick={ev => createNewSet(val => !val)}>
						<PlaylistAddIcon className="icon" />
					</IconButton>
				</Tooltip>
			</Box>
			{createNew &&
				<Paper className="padded">
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<TextField
								inputRef={nameRef}
								label="Report Name"
								defaultValue=""
								variant="outlined"
							/>
						</Grid>
						<Grid item xs={12} sm={6} className="save">
							<Button
								color="primary"
								onClick={create}
								variant="contained"
							>
								Create New
							</Button>
						</Grid>
					</Grid>
				</Paper>
			}
			{reports.map(o =>
				<Report
					key={o._id}
					onSave={update}
					{...o}
				/>
			)}
		</Box>
	);
}

// Valid props
ReportRecipients.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
