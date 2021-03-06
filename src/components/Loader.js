/**
 * Loader
 *
 * Handles the loader
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-08
 */

// NPM modules
import React, { useState } from 'react';

// Shared generic modules
import Events from  'shared/generic/events';

// Shared hooks
import { useEvent } from 'shared/hooks/event';

// Local variables
let _count = 1;

// Loader component
export default function Loader(props) {

	// State
	let [visible, visibleSet] = useState(_count !== 0);

	// Hooks
	useEvent('Loader', show => visibleSet(show));

	// Render
	return <img id="loader" src="/images/ajax.gif" alt="ajax" style={{display: visible ? 'inline' : 'none'}} />
}

export function LoaderHide() {

	// Decrement the count
	_count--;

	// If this is the last one
	if(_count === 0) {
		Events.trigger('Loader', false);
	}
}

export function LoaderShow() {

	// Increment the count
	_count++;

	// If this is the first one
	if(_count === 1) {
		Events.trigger('Loader', true);
	}
}
