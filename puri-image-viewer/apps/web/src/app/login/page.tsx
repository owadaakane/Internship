'use client';

import { useCallback, useState } from 'react';
import { useStore } from 'zustand';
import authStore from '@web/stores/authStore';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';
import Loading from '@web/components/Loading';
import Button from '@web/components/Button';
import InputText from '@web/components/InputText';

export default function Page() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const login = useStore(authStore, (state) => state.login);
  const isLoggingIn = useStore(authStore, (state) => state.isLoggingIn);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!username || !password) {
        setError('Username or Password is Empty.');
        return;
      }
      if (await login(username, password)) {
        router.push('/');
      }

      const idToken = await login(username, password);
      confirm(`Login is ${idToken ? 'success' : 'failure'}.`);
    },
    [login, username, password, router]
  );

  return (
    <>
      {/* `isLoggingIn`がtrueの場合、ローディング表示を行う*/}
      {isLoggingIn && <Loading />}
      <div className={styles.container}>
        <div className={styles.content}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.container}>
            <div className={styles.content}>
              <h1>Welcome to Puri Viewer!!</h1>
              <p>This is a image viewer application for internship.</p>
              <form onSubmit={handleSubmit}>
                <InputText
                  title='Username '
                  id='username'
                  type='text'
                  placeholder='username'
                  onChange={(e) => setUsername(e.target.value)}
                />
                <InputText
                  title='Password '
                  id='password'
                  type='password'
                  placeholder='password'
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button buttonName='Log in' />
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
