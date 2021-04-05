/**
 * Sign In
 *
 * Handles sign in modal
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-24
 */

// NPM modules
import React, { useRef, useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Sign In
export default function SignIn(props) {

	// State
	let [errors, errorsSet] = useState({});

	// Refs
	let emailRef = useRef();
	let passwdRef = useRef()

	// Fetch the user data after signin
	function fetchUser() {

		// Fetch the user data
		Rest.read('auth', 'user', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Welcome user
				Events.trigger('success', 'Welcome ' + res.data.firstName);

				// Trigger the signedIn event
				Events.trigger('signedIn', res.data);
			}
		});
	}

	// Trap enter clicks to trigger sign in
	function keyPressed(event) {
		if(event.key === 'Enter') {
			signin();
		}
	}

	// Attempt to sign in with the given credentials
	function signin(ev) {

		// Call the signin
		Rest.create('auth', 'signin', {
			"email": emailRef.current.value,
			"passwd": passwdRef.current.value
		}, {session: false}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				switch(res.error.code) {
					case 1001:
						// Go through each message and mark the error
						let errors = {};
						for(let i in res.error.msg) {
							errors[i] = res.error.msg[i];
						}
						errorsSet(errors);
						break;
					case 1201:
						Events.trigger('error', 'Email or password invalid');
						break;
					default:
						Events.trigger('error', Rest.errorMessage(res.error));
						break;
				}
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Set the session with the service
				Rest.session(res.data.session);

				// Fetch the user info
				fetchUser();
			}

		});
	}

	// Render
	return (
		<Dialog
			id="signin"
			disableBackdropClick
			disableEscapeKeyDown
			maxWidth="lg"
			open={true}
			aria-labelledby="confirmation-dialog-title"
		>
			<DialogTitle id="confirmation-dialog-title">Welcome, please sign in</DialogTitle>
			<DialogContent dividers>
				<div><TextField
					error={errors.email ? true : false}
					helperText={errors.email || ''}
					inputRef={emailRef}
					label="Email"
					onKeyPress={keyPressed}
					type="email"
				/></div>
				<div><TextField
					error={errors.passwd ? true : false}
					helperText={errors.passwd || ''}
					inputRef={passwdRef}
					label="Password"
					onKeyPress={keyPressed}
					type="password"
				/></div>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="primary" onClick={signin}>
					Sign In
				</Button>
			</DialogActions>
		</Dialog>
	);
}
