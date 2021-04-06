/**
 * Users
 *
 * Users page
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-06
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import Tree from 'format-oc/Tree'

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

// Material UI Icons
import HttpsIcon from '@material-ui/icons/Https';
import PersonAddIcon from '@material-ui/icons/PersonAdd';

// Format Components
import { Form, Results, Search } from 'shared/components/Format';

// Composites
import Permissions from './Permissions';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { omap } from 'shared/generic/tools';

// Definitions
import UserDef from 'definitions/auth/user';
import Divisions from 'definitions/divisions';

// Generate the user Tree
const UserTree = new Tree(UserDef);

// Update the division (state) info
let oStateReact = UserTree.get('division').special('react');
oStateReact.options = omap(Divisions.US, (v,k) => [k, v]);
UserTree.get('division').special('react', oStateReact);

/**
 * Users
 *
 * Handles user (login) management
 *
 * @name Users
 * @access public
 * @param Object props Properties passed to the component
 * @returns React.Component
 */
export default function Users(props) {

	// State
	let [create, createSet] = useState(false);
	let [permissions, permissionsSet] = useState(false);
	let [users, usersSet] = useState([]);

	// Refs
	let permissionsRef = useRef();

	function createSuccess(user) {
		createSet(false);
		usersSet([user]);
	}

	function createToggle() {
		createSet(val => !val);
	}

	function permissionsCancel() {
		permissionsSet(false);
	}

	function permissionsShow(user_id) {

		// Fetch the agent's permissions
		Rest.read('auth', 'permissions', {
			"user": user_id
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

				// Set the permissions
				permissionsSet({
					"_id": user_id,
					"rights": res.data
				});
			}
		});
	}

	function permissionsUpdate() {

		// Fetch the agent's permissions
		Rest.update('auth', 'permissions', {
			"user": permissions._id,
			"permissions": permissionsRef.current.value
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

				// Hide permissions dialog
				permissionsSet(false);

				// Notify success
				Events.trigger('success', 'Permissions updated');
			}
		});
	}

	function search(users) {
		usersSet(users);
	}

	// Render
	return (
		<Box id="users" className="page flexGrow">
			<Box className="page_header">
				<Typography className="title">Users</Typography>
				<Tooltip title="Create new User">
					<IconButton onClick={createToggle}>
						<PersonAddIcon className="icon" />
					</IconButton>
				</Tooltip>
			</Box>
			{create &&
				<Paper className="padded">
					<Form
						cancel={createToggle}
						errors={{1200: "Email already in use", 1204: "Password not strong enough"}}
						noun="user"
						service="auth"
						success={createSuccess}
						tree={UserTree}
						type="create"
					/>
				</Paper>
			}
			<Search
				hash="users"
				name="users"
				noun="search"
				service="auth"
				success={search}
				tree={UserTree}
			/>
			<Results
				actions={[
					{"tooltip": "Edit User's permissions", "icon": HttpsIcon, "callback": permissionsShow}
				]}
				data={users}
				noun="user"
				orderBy="email"
				service="auth"
				tree={UserTree}
			/>
			{permissions &&
				<Dialog
					aria-labelledby="confirmation-dialog-title"
					maxWidth="lg"
					onClose={permissionsCancel}
					open={true}
				>
					<DialogTitle id="permissions-dialog-title">Update Permissions</DialogTitle>
					<DialogContent dividers>
						<Permissions
							ref={permissionsRef}
							user={permissions.id}
							value={permissions.rights}
						/>
					</DialogContent>
					<DialogActions>
						<Button variant="contained" color="secondary" onClick={permissionsCancel}>
							Cancel
						</Button>
						<Button variant="contained" color="primary" onClick={permissionsUpdate}>
							Update
						</Button>
					</DialogActions>
				</Dialog>
			}
		</Box>
	);
}

// Valid props
Users.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
