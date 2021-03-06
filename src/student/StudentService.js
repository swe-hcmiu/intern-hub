const _ = require('lodash');
const { transaction } = require('objection');

const { Student } = require('./Student');
const { StudentSkill } = require('../studentSkill/StudentSkill');
const { User } = require('../user/User');
const { knex } = require('../../config/mysql/mysql-config');

class StudentService {
  static async getListOfStudents() {
    try {
      const listOfStudents = await Student.query().eager('[users, skills]')
        .modifyEager('users', (builder) => {
          builder.select('displayname', 'email', 'phoneNumber');
        });
      return listOfStudents;
    } catch (err) {
      throw err;
    }
  }

  static async searchStudentBySkills(listOfSkills) {
    try {
      const listOfRecvStudents = await StudentSkill
        .query()
        .join('skills', (join) => {
          join.on('studentSkill.skillId', '=', 'skills.skillId');
        })
        .select('studentId')
        .whereIn('skillName', listOfSkills)
        .groupBy('studentId')
        .orderBy(knex.raw('count(*)'), 'desc');

      const listOfStudentIds = [];
      listOfRecvStudents.forEach((element) => {
        listOfStudentIds.push(element.studentId);
      });

      const listOfInorderedStudents = await Student.query().eager('[skills, users]')
        .whereIn('studentId', listOfStudentIds)
        .modifyEager('users', (builder) => {
          builder.select('displayname', 'email', 'phoneNumber');
        });
      const listOfStudents = _.sortBy(listOfInorderedStudents, (item) => {
        return listOfStudentIds.indexOf(item.studentId);
      });
      return listOfStudents;
    } catch (err) {
      throw err;
    }
  }

  static async getStudent(student) {
    try {
      const listOfStudents = await Student.query().eager('[skills]').where(student);
      const recvStudent = listOfStudents[0];

      return recvStudent;
    } catch (err) {
      throw err;
    }
  }

  static async updateStudentInfo(user) {
    try {
      let recvUser;
      await transaction(User.knex(), async (trx) => {
        recvUser = await User
          .query(trx)
          .upsertGraphAndFetch(user);
      });
      return recvUser;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = {
  StudentService,
};
