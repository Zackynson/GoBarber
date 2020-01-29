import User from '../models/User';

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'user already exists' });
    }

    const user = await User.create(req.body);

    const { id, name, email, provider } = user;
    return res.json({ id, name, email, provider });
  }

  async update(req, res) {
    const { email, oldPassword, password } = req.body;

    const user = await User.findByPk(req.userId);

    if (email && email !== user.email) {
      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({ error: 'user already exists' });
      }
    }

    if (password && !oldPassword) {
      return res.status(401).json({ error: 'old password not provided' });
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'password does not match' });
    }

    const { id, name, provider } = await user.update(req.body);

    return res.json({ id, name, email, provider });
  }
}

export default new UserController();
