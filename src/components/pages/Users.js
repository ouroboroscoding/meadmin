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
import Tree from 'format-oc/Tree'
import React, { useRef, useState } from 'react';

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

// Components
import ResultsComponent from '../format/Results';
import SearchComponent from '../format/Search';
import FormComponent from '../format/Form';

// Composites
import Permissions from './Users/Permissions';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import Tools from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Definitions
import UserDef from '../../definitions/auth/user';
import Divisions from '../../definitions/divisions';

// Generate the user Tree
const UserTree = new Tree(UserDef);

// Update the division (state) info
let oStateReact = UserTree.get('division').special('react');
oStateReact.options = Tools.omap(Divisions.US, (v,k) => [k, v]);
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
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
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
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
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
		<Box id="users">
			<Box className="pageHeader">
				<Typography variant="h3" className="title">Users</Typography>
				<Tooltip title="Create new User">
					<IconButton onClick={createToggle}>
						<PersonAddIcon className="icon" />
					</IconButton>
				</Tooltip>
			</Box>
			{create &&
				<Paper className="padded">
					<FormComponent
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
			<SearchComponent
				hash="users"
				noun="search"
				service="auth"
				success={search}
				tree={UserTree}
			/>
			<ResultsComponent
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
