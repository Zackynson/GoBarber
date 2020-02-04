import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number()
        .integer()
        .required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { provider_id, date } = req.body;

    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'you can only create appointments with providers' });
    }

    if (provider_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'you cannot create appointments to yourself' });
    }

    // verifica se a data nao passou
    const hourStart = startOfHour(parseISO(date));
    if (isBefore(hourStart, new Date())) {
      return res
        .status(401)
        .json({ error: 'you cannot create appointments to past dates' });
    }

    // verifica a disponibilidade do prestador de servicos
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res.status(401).json({ error: 'Appointment date not available' });
    }

    // cria o apontamento
    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    // notifica o prestador de servicos

    const user = await User.findByPk(req.userId);
    const formatedDate = format(
      hourStart,
      "'Dia 'dd' de 'MMMM', às 'H'h'mm'min'",
      {
        locale: pt,
      }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formatedDate}`,
      user: provider_id,
    });
    return res.json(appointment);
  }

  async delete(req, res) {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: 'provider', attributes: ['name', 'email'] },
        { model: User, as: 'user', attributes: ['name'] },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ error: 'appointment not found' });
    }

    if (appointment.canceled_at !== null) {
      return res.status(400).json({ error: 'appointment already canceled' });
    }

    if (appointment.user_id !== req.userId) {
      return res
        .status(401)
        .json("you don't have permission to cancel this appointment");
    }

    const limitDate = subHours(appointment.date, 2);

    if (isBefore(limitDate, new Date())) {
      return res.status(401).json({
        error: 'you can only cancel appointments with 2 hours in advance',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento Cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(appointment.date, "'Dia 'dd' de 'MMMM', às 'H'h'mm'min'", {
          locale: pt,
        }),
      },
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
