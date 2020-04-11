import React from 'react';
import { Link } from 'react-router-dom';
import { Form, Input } from '@rocketseat/unform';
import * as Yup from 'yup';
import logo from '~/assets/logo.svg';

export default function SignUp() {
  const schema = Yup.object().shape({
    email: Yup.string()
      .email('Insira um email valido')
      .required('O email é obrigatorio'),
    name: Yup.string().required('O nome é obrigatorio'),
    password: Yup.string()
      .min(6, 'A senha deve ter no minimo 6 caracteres')
      .required('A senha é obrigatoria'),
  });

  function handleSubmit(data) {
    console.log(data);
  }

  return (
    <>
      <img src={logo} alt="GoBarber" />

      <Form schema={schema} onSubmit={handleSubmit}>
        <Input name="name" type="text" placeholder="Seu Nome" />
        <Input name="email" type="text" placeholder="Seu Email" />
        <Input name="password" type="text" placeholder="Sua senha secreta" />

        <button type="submit">Criar Conta</button>
        <Link to="/">Já tenho uma conta</Link>
      </Form>
    </>
  );
}
