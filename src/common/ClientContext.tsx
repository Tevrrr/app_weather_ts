/** @format */

import React, {
	FC,
	createContext,
	useState,
	useContext,
} from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabaseClient';
import { IUser, AlertType } from './Types';
import { AlertsContext } from '../common/AlertContext';

interface ClientProviderProps {}

export const ClientContext = createContext<IUser>({
	loading: false,
	user: null,
	registerUser: (email: string, password: string, userName: string) => {},
	login: (email: string, password: string) => {},
});

const serializeUser = (user: any) =>
	user
		? {
				id: user.id,
				email: user.email,
				...user.user_metadata,
		  }
		: null;

const ClientProvider: FC<ClientProviderProps> = ({ children }) => {
	const alerts = useContext(AlertsContext);
	const [loading, setLoading] = useState<null | boolean>(false);
	const [user, setUser] = useState<null | User>(null);
	const registerUser = async (
		email: string,
		password: string,
		userName: string
	) => {
		try {
			const { data: _user, error: _error } = await supabase
				.from('users')
				.select()
				.eq('email', email);
			if (_error) throw _error;
			console.log(_user);
            if (_user.length === 0) {
                const { user, error } = await supabase.auth.signUp(
					{ email, password },
					{
						data: {
							userName,
						},
					}
				);
				if (error) throw error;
				const { data: _user, error: _error } = await supabase
					.from('users')
					.insert([serializeUser(user)])
					.single();
				if (_error) throw _error;
				alerts.addAlert(
					AlertType.success,
					'Account created successfully! An email has been sent to you to confirm it.'
				);

			} else {
				alerts.addAlert(
					AlertType.error,
					'The user with this email is already registered!'
				);				
			}
		} catch (e) {
			console.log(e);
			console.log('Все хуева');
		}
	};

	const login = async (email: string, password: string) => {
		try {
			const { user, error } = await supabase.auth.signIn({
				email,
				password,
			});
            if (error) throw error;
            setUser(user);
			console.log(user);
			console.log('Все заебиса');
		} catch (e: any) {
			console.log(e);
			if ((e.message = 'Invalid login credentials'))
				alerts.addAlert(AlertType.error, 'Wrong login or password!');
		}
	};

	return (
		<ClientContext.Provider value={{ loading, user, registerUser, login }}>
			{children}
		</ClientContext.Provider>
	);
};

export default ClientProvider;