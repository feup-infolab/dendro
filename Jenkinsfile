pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                npm install
                cd public
                bower install
                cd ..
            }
        }
        stage('Test') {
            steps {
                npm run test
                npm run coverage
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
