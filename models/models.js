import { DataTypes } from "sequelize";
import User from "./User"
import Poem from "./Poem"
import Tag from "./Tag"
import PoemTag from "./PoemTag"
import { Sequelize } from 'sequelize';



const Models = {
    TestModel: (sequelize) => {
        const model = sequelize.define('TestModel', {
            // Model attributes are defined here
            firstName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            lastName: {
                type: DataTypes.STRING
                // allowNull defaults to true
            }
            }, {
            // Other model options go here
        });
        return model;
    },
    User,
    Poem,
    Tag,
    PoemTag,
    Final: (sequelize) => {
        const tag = Tag(sequelize);
        const user = User(sequelize);
        const poem = Poem(sequelize);

        tag.belongsToMany(poem, { through: 'poemtags', allowNull: false });
        user.hasMany(poem, { allowNull: true });
        poem.belongsTo(user, { allowNull: false  });
        poem.belongsToMany(tag, { through: 'poemtags', allowNull: true });
        return {
            Tag: tag,
            User: user,
            Poem: poem
        }
    }
}  




export default Models.Final;