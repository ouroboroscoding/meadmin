/**
 * Account
 *
 * Handles account settings
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-01-23
 */

// NPM modules
import Tree from 'format-oc/Tree'
import React, { useRef } from 'react';

// Material UI
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import Divider from '@material-ui/core/Divider';

// Format Components
import { Form } from 'shared/components/Format';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

// Definitions
import PassDef from 'definitions/auth/password';
import UserDef from 'definitions/auth/user';

// Generate the Trees
const PassTree = new Tree(clone(PassDef));
const UserTree = new Tree(clone(UserDef));

// Override the react values
UserTree.special('react', {
	update: ['email', 'title', 'firstName', 'lastName', 'suffix', 'phoneCode',
				'phoneNumber', 'phoneExt']
})

// Account component
export default function Account(props) {

	let passForm = useRef();

	function passwordCheck(values) {
		if(values.new_passwd !== values.confirm_passwd) {
			Events.trigger('error', 'Passwords don\'t match');
			return false;
		}
		return values;
	}

	function passwordSuccess() {
		passForm.current.value = {
			passwd: '', new_passwd: '', confirm_passwd: ''
		};
	}

	function updateSuccess(user) {
		Rest.read('auth', 'user', {}).done(res => {
			Events.trigger('signedIn', res.data);
		});
	}

	return (
		<Dialog
			maxWidth="lg"
			onClose={props.onCancel}
			open={true}
			aria-labelledby="confirmation-dialog-title"
		>
			<DialogTitle id="confirmation-dialog-title">Account Details</DialogTitle>
			<DialogContent dividers>
				<Form
					noun="user"
					service="auth"
					success={updateSuccess}
					tree={UserTree}
					type="update"
					value={props.user}
				/>
				<Divider />
				<br />
				<Form
					beforeSubmit={passwordCheck}
					errors={{1204: "Password not strong enough"}}
					noun="user/passwd"
					ref={passForm}
					success={passwordSuccess}
					service="auth"
					tree={PassTree}
					type="update"
				/>
			</DialogContent>
		</Dialog>
	);
}
